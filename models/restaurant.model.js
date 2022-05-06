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
          resolve(rows);
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
            db.all(
              "SELECT * FROM reviews WHERE res_id = ?",
              [id],
              function (err, rows) {
                if (err) {
                  console.log({ err });
                  return reject();
                }
                row.reviews = rows;
                resolve(row);
              }
            );
          } else reject();
        }
      );
    });
  },
};
