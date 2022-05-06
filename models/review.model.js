const db = require("./");
module.exports.Review = {
  getReviewByResId: function ({ resId, limit = 10, page = 0 }) {
    return new Promise((resolve, reject) => {
      db.all(
        "SELECT * FROM reviews WHERE res_id = ? LIMIT ? OFFSET ?",
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
  getReviewByProductId: function ({ productId, limit = 10, page = 0 }) {
    return new Promise((resolve, reject) => {
      db.all(
        "SELECT * FROM reviews WHERE product_id = ? LIMIT ? OFFSET ?",
        [productId, limit, page * limit],
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
