const db = require("./");
const md5 = require("md5");
module.exports.Restaurant = {
  getRestaurants: function ({ limit = 10, page = 0 }) {
    return new Promise((resolve, reject) => {
      db.all(
        "SELECT * FROM restaurants LIMIT ? OFFSET ?",
        [limit, page * limit],
        function (err, rows) {
          if (err) {
            console.log({ err });
            return reject();
          }
          const results = rows.map((row) => ({
            ...row,
            verified: row.verified === 1,
          }));
          resolve(results);
        }
      );
    });
  },
  getRestaurantById: function (id) {
    return new Promise((resolve, reject) => {
      db.get(
        "SELECT * FROM restaurants WHERE id = ?",
        [id],
        function (err, row) {
          if (err) {
            console.log({ err });
            return reject();
          }
          if (row) {
            //get summary of reviews
            db.get(
              "SELECT avg(rating) as avg_rating, count(id) as total_reviews FROM reviews WHERE res_id = ? GROUP BY res_id",
              [id],
              function (err, review) {
                if (err) {
                  console.log({ err });
                  return reject();
                }
                row.avg_rating = review.avg_rating;
                row.total_reviews = review.total_reviews;
                row.verified = row.verified === 1;
                resolve(row);
              }
            );
          } else reject();
        }
      );
    });
  },
};
