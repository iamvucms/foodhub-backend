const db = require("./");
const md5 = require("md5");
const { ProductAddons } = require("./product_addons.model");
const { Database } = require("../utils/query");
module.exports.Product = {
  getProducts: function ({
    limit = 10,
    page = 0,
    orderBy = "avg_rating",
    orderType = "DESC",
    q = "",
  }) {
    return new Promise((resolve, reject) => {
      db.all(
        `SELECT products.*,avg(rating) as avg_rating,count(reviews.id) as total_reviews,categories.name as category_name
          FROM products left join reviews ON(products.id=reviews.product_id) left join categories ON(categories.id=products.cat_id) WHERE products.name LIKE '%${q}%' GROUP BY products.id ORDER BY ${orderBy} ${orderType} LIMIT ? OFFSET ?`,
        [limit, page * limit],
        function (err, rows) {
          if (err) {
            console.log({ err });
            return reject("Something went wrong");
          }
          const productIds = rows.map((row) => row.id).join(",");
          db.all(
            "SELECT * FROM product_addons WHERE product_id IN (" +
              productIds +
              ")",
            function (err, addons) {
              if (err) {
                console.log({ err });
                reject("Something went wrong");
              }
              const addonJson = {};
              addons.forEach((addon) => {
                if (addonJson[addon.product_id]) {
                  addonJson[addon.product_id].push(addon);
                } else {
                  addonJson[addon.product_id] = [addon];
                }
              });
              const results = rows.map((x) => ({
                ...x,
                options: addonJson[x.id] || [],
              }));
              resolve(results);
            }
          );
        }
      );
    });
  },
  getSuggestProducts: async function ({
    limit = 10,
    page = 0,
    categoryIds = [],
    restaurantIds = [],
    skipProductIds,
  }) {
    try {
      const categoryString = categoryIds.join(",");
      const restaurantString = restaurantIds.join(",");
      const skipProductString = skipProductIds.join(",");
      const rows = await Database.all(
        `SELECT products.*,avg(rating) as avg_rating,count(reviews.id) as total_reviews,categories.name as category_name
            FROM products left join reviews ON(products.id=reviews.product_id) left join categories ON(categories.id=products.cat_id) ${
              categoryIds.length + restaurantIds.length > 0
                ? `WHERE ${
                    categoryIds.length > 0
                      ? `products.cat_id IN(${categoryString})`
                      : ""
                  } ${
                    categoryIds.length > 0 && restaurantIds.length > 0
                      ? `AND`
                      : ""
                  } ${
                    restaurantIds.length > 0
                      ? `products.res_id IN(${restaurantString})`
                      : ""
                  } ${
                    skipProductIds.length > 0
                      ? ` AND products.id NOT IN(${skipProductString})`
                      : ""
                  }`
                : ""
            } GROUP BY products.id ORDER BY avg_rating DESC,total_reviews DESC LIMIT ? OFFSET ?`,
        [limit, page * limit]
      );
      const productIds = rows.map((row) => row.id).join(",");
      const addons = await Database.all(
        "SELECT * FROM product_addons WHERE product_id IN (" + productIds + ")"
      );
      const addonJson = {};
      addons.forEach((addon) => {
        if (addonJson[addon.product_id]) {
          addonJson[addon.product_id].push(addon);
        } else {
          addonJson[addon.product_id] = [addon];
        }
      });
      const results = rows.map((x) => ({
        ...x,
        options: addonJson[x.id] || [],
      }));
      return results;
    } catch (e) {
      console.log(e);
      throw new Error("Something went wrong");
    }
  },
  getProductById: function (productId) {
    return new Promise((resolve, reject) => {
      db.get(
        `SELECT products.*,avg(rating) as avg_rating,count(reviews.id) as total_reviews FROM products left join reviews ON(products.id=reviews.product_id) WHERE products.id = ? GROUP BY products.id`,
        [productId],
        function (err, row) {
          if (err) {
            console.log({ err });
            return reject("Something went wrong");
          }
          if (row) {
            ProductAddons.getProductAddonsByProductId(productId)
              .then((options) => {
                row.options = options;
                resolve(row);
              })
              .catch((e) => reject(e));
          } else reject("Product not found");
        }
      );
    });
  },
  getProductsByRestaurantId: function ({
    resId,
    limit = 10,
    page = 0,
    orderBy = "avg_rating",
    orderType = "DESC",
    categoryId,
  }) {
    return new Promise((resolve, reject) => {
      db.all(
        `SELECT products.*,avg(rating) as avg_rating,count(reviews.id) as total_reviews,categories.name as category_name FROM products left join reviews ON(products.id=reviews.product_id) left join categories ON(categories.id=products.cat_id)  WHERE products.res_id = ? ${
          !!categoryId ? "AND products.cat_id=" + categoryId : ""
        } GROUP BY products.id ORDER BY ${orderBy} ${orderType} LIMIT ? OFFSET ?`,
        [resId, limit, page * limit],
        function (err, rows) {
          if (err) {
            console.log({ err });
            return reject("Something went wrong");
          }
          const productIds = rows.map((row) => row.id).join(",");
          db.all(
            "SELECT * FROM product_addons WHERE product_id IN (" +
              productIds +
              ")",
            function (err, addons) {
              if (err) {
                console.log({ err });
                reject("Something went wrong");
              }
              const addonJson = {};
              addons.forEach((addon) => {
                if (addonJson[addon.product_id]) {
                  addonJson[addon.product_id].push(addon);
                } else {
                  addonJson[addon.product_id] = [addon];
                }
              });
              const results = rows.map((x) => ({
                ...x,
                options: addonJson[x.id] || [],
              }));
              resolve(results);
            }
          );
        }
      );
    });
  },
  getLatestProductId: function () {
    return new Promise((resolve, reject) => {
      db.get(
        "SELECT id FROM products ORDER BY id DESC LIMIT 1",
        function (err, row) {
          if (err) {
            reject("Something went wrong");
          }
          resolve(row.id);
        }
      );
    });
  },
  getLatestProduct: function () {
    return new Promise((resolve, reject) => {
      db.get(
        `SELECT products.*,avg(rating) as avg_rating,count(reviews.id) as total_reviews FROM products left join reviews ON(products.id=reviews.product_id) GROUP BY products.id ORDER BY id DESC LIMIT 1`,
        function (err, row) {
          if (err) {
            console.log({ err });
            return reject("Something went wrong");
          }
          if (row) {
            ProductAddons.getProductAddonsByProductId(row.id)
              .then((options) => {
                row.options = options;
                resolve(row);
              })
              .catch((e) => reject(e));
          } else {
            reject("No product found");
          }
        }
      );
    });
  },
  getProductsByCategoryId: function ({
    catId,
    limit = 10,
    page = 0,
    orderBy = "id",
    orderType = "ASC",
  }) {
    return new Promise((resolve, reject) => {
      db.all(
        `SELECT products.*,avg(rating) as avg_rating,count(reviews.id) as total_reviews FROM products left join reviews ON(products.id=reviews.product_id) WHERE products.cat_id = ? GROUP BY products.id ORDER BY ${orderBy} ${orderType} LIMIT ? OFFSET ?`,
        [catId, limit, page * limit],
        function (err, rows) {
          if (err) {
            console.log({ err });
            return reject("Something went wrong");
          }
          const productIds = rows.map((row) => row.id).join(",");
          db.all(
            "SELECT * FROM product_addons WHERE product_id IN (" +
              productIds +
              ")",
            function (err, addons) {
              if (err) {
                console.log({ err });
                reject("Something went wrong");
              }
              const addonJson = {};
              addons.forEach((addon) => {
                if (addonJson[addon.product_id]) {
                  addonJson[addon.product_id].push(addon);
                } else {
                  addonJson[addon.product_id] = [addon];
                }
              });
              const results = rows.map((x) => ({
                ...x,
                options: addonJson[x.id] || [],
              }));
              resolve(results);
            }
          );
        }
      );
    });
  },
  createProduct: async function (product) {
    try {
      await Database.run(
        "INSERT INTO products (name,description,price,image,cat_id,res_id) VALUES (?,?,?,?,?,?)",
        [
          product.name,
          product.description,
          product.price,
          product.image,
          product.res_id,
          product.cat_id,
        ]
      );
      return true;
    } catch (e) {
      console.log({ e });
      throw new Error("Something went wrong");
    }
  },
  updateProduct: async function ({ productId, product }) {
    try {
      const dataString = [];
      const data = [];
      for (const key in product) {
        if (key !== "id") {
          dataString.push(`${key} = ?`);
          data.push(product[key]);
        }
      }
      await Database.run(
        "UPDATE products SET " + dataString.join(", ") + " WHERE id = ?",
        [...data, productId]
      );
      return true;
    } catch (e) {
      console.log(e);
      throw new Error("Something went wrong");
    }
  },
  deleteProduct: function (productId) {
    return new Promise((resolve, reject) => {
      db.run("DELETE FROM products WHERE id = ?", [productId], function (err) {
        if (err) {
          reject(err);
        }
        resolve(true);
      });
    });
  },
};
