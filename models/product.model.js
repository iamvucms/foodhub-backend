const db = require("./");
const md5 = require("md5");
module.exports.Product = {
  getProducts: function ({ limit = 10, page = 0 }) {
    return new Promise((resolve, reject) => {
      db.all(
        `SELECT products.*,avg(rating) as avg_rating,count(reviews.id) as total_reviews ,
         "["||group_concat("{'name':'"||product_addons.name||"','id':"||product_addons.id||",'price':"||product_addons.price||",'image':'"||product_addons.image||"'}")||"]" as options FROM products left join reviews ON(products.id=reviews.product_id) left join product_addons ON(product_addons.product_id=products.id) GROUP BY products.id LIMIT ? OFFSET ?`,
        [limit, page * limit],
        function (err, rows) {
          if (err) {
            console.log({ err });
            return reject("Something went wrong");
          }
          const results = rows.map((x) => ({
            ...x,
            options: JSON.parse(x.options.replaceAll(`'`, `"`)),
          }));
          resolve(results);
        }
      );
    });
  },
  getProductById: function (id) {
    return new Promise((resolve, reject) => {
      db.get("SELECT * FROM products WHERE id = ?", [id], function (err, row) {
        if (err) {
          console.log({ err });
          return reject("Something went wrong");
        }
        if (row) {
          resolve(row);
        } else reject("Product not found");
      });
    });
  },
  getProductsByRestaurantId: function ({ resId, limit = 10, page = 0 }) {
    return new Promise((resolve, reject) => {
      db.all(
        "SELECT * FROM products WHERE res_id = ? LIMIT ? OFFSET ?",
        [resId, limit, page * limit],
        function (err, rows) {
          if (err) {
            console.log({ err });
            return reject("Something went wrong");
          }
          resolve(rows);
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
        "SELECT * FROM products WHERE cat_id = ? LIMIT ? OFFSET ? ORDER BY ? ?",
        [catId, limit, page * limit, orderBy, orderType],
        function (err, rows) {
          if (err) {
            console.log({ err });
            return reject("Something went wrong");
          }
          resolve(rows);
        }
      );
    });
  },
};
