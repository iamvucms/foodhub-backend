const db = require("./");
module.exports.Review = {
  getReviewsByProductId: function ({ productId, limit = 10, page = 0 }) {
    console.log({ productId, limit, page });
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
  getReviewsByRestaurantId: function ({ resId, limit = 10, page = 0 }) {
    return new Promise((resolve, reject) => {
      db.all(
        "SELECT reviews.*,name as reviewer_name,avatar as reviewer_avatar FROM reviews inner join users ON(reviews.reviewer_id=users.id) WHERE res_id = ? LIMIT ? OFFSET ?",
        [resId, limit, limit * page],
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
