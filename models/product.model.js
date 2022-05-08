const db = require("./");
const md5 = require("md5");
const { ProductAddons } = require("./product_addons.model");
module.exports.Product = {
  getProducts: function ({ limit = 10, page = 0 }) {
    return new Promise((resolve, reject) => {
      db.all(
        `SELECT products.*,avg(rating) as avg_rating,count(reviews.id) as total_reviews
          FROM products left join reviews ON(products.id=reviews.product_id) GROUP BY products.id LIMIT ? OFFSET ?`,
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
  getProductsByRestaurantId: function ({ resId, limit = 10, page = 0 }) {
    return new Promise((resolve, reject) => {
      db.all(
        `SELECT products.*,avg(rating) as avg_rating,count(reviews.id) as total_reviews FROM products left join reviews ON(products.id=reviews.product_id) WHERE products.res_id = ? GROUP BY products.id LIMIT ? OFFSET ?`,
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
            ProductAddons.getProductAddonsByProductId(productId)
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
      console.log(`${orderBy} ${orderType}`);
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
  createProduct: function (product) {
    return new Promise((resolve, reject) => {
      db.run(
        "INSERT INTO products (name,description,price,image,cat_id,res_id) VALUES (?,?,?,?,?,?)",
        [
          product.name,
          product.description,
          product.price,
          product.image,
          product.res_id,
          product.cat_id,
        ],
        function (err) {
          if (err) {
            console.log(err);
            reject(err);
          }
          resolve(true);
        }
      );
    });
  },
  updateProduct: function ({ productId, product }) {
    return new Promise((resolve, reject) => {
      const dataString = [];
      const data = [];
      for (const key in product) {
        if (key !== "id") {
          dataString.push(`${key} = ?`);
          data.push(product[key]);
        }
      }
      db.run(
        "UPDATE products SET " + dataString.join(", ") + " WHERE id = ?",
        [...data, productId],
        function (err) {
          if (err) {
            reject(err);
          }
          resolve(true);
        }
      );
    });
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
