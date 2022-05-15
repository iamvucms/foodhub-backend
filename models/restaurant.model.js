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
                row.verified = row.verified === 1;
                resolve(row);
              }
            );
          } else reject();
        }
      );
    });
  },
  createRestaurant: function ({ userId, restaurant }) {
    return new Promise((resolve, reject) => {
      db.run(
        "INSERT INTO restaurants (name, logo, address, cover_image,delivery_fee, owner_id) VALUES (?,?,?,?,?,?)",
        [
          restaurant.name,
          restaurant.logo,
          restaurant.address,
          restaurant.cover_image,
          restaurant.delivery_fee,
          userId,
        ],
        function (err) {
          if (err) {
            console.log({ err });
            return reject("Something went wrong");
          }
          resolve(true);
        }
      );
    });
  },
  getLatestRestaurant: function () {
    return new Promise((resolve, reject) => {
      db.get(
        "SELECT * FROM restaurants ORDER BY id DESC LIMIT 1",
        function (err, row) {
          if (err) {
            console.log({ err });
            return reject("Something went wrong");
          }
          resolve(row);
        }
      );
    });
  },
  getRestaurantByUserId: function (userId) {
    return new Promise((resolve, reject) => {
      db.get(
        "SELECT * FROM restaurants WHERE owner_id = ?",
        [userId],
        function (err, row) {
          if (err) {
            console.log({ err });
            return reject("Something went wrong");
          }
          resolve(row);
        }
      );
    });
  },
  updateRestaurant: function ({ restaurantId, restaurant }) {
    return new Promise((resolve, reject) => {
      const dataString = [];
      const data = [];
      for (const key in restaurant) {
        if (key !== "id") {
          dataString.push(`${key}=?`);
          data.push(restaurant[key]);
        }
      }
      data.push(restaurantId);
      db.run(
        "UPDATE restaurants SET " + dataString + " WHERE id=?",
        data,
        function (err) {
          if (err) {
            console.log({ err });
            return reject("Something went wrong");
          }
          resolve(true);
        }
      );
    });
  },
};
