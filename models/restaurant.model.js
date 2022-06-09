const db = require("./");
const md5 = require("md5");
const { Database } = require("../utils/query");
module.exports.Restaurant = {
  getRestaurants: async function ({ limit = 10, page = 0, q = "" }) {
    try {
      const rows = await Database.all(
        `SELECT restaurants.*,avg(rating) as avg_rating,count(reviews.id) as total_reviews FROM restaurants left join reviews ON(reviews.res_id=restaurants.id) WHERE restaurants.name LIKE '%${q}%' GROUP BY restaurants.id ORDER BY avg_rating DESC LIMIT ? OFFSET ?`,
        [limit, page * limit]
      );
      const restaurantIds = rows.map((row) => row.id);
      const categories = await Database.all(
        "SELECT GROUP_CONCAT(categories.name ||'|'|| categories.id) as categories,res_id FROM products inner join categories ON(products.cat_id=categories.id) WHERE res_id IN (" +
          restaurantIds.join(",") +
          ") GROUP BY res_id"
      );
      const categoriesMap = {};
      categories.forEach((category) => {
        categoriesMap[category.res_id] = Array.from(
          new Set(category.categories.split(","))
        ).map((x) => {
          const [name, id] = x.split("|");
          return { name, id };
        });
      });
      const results = rows.map((row) => ({
        ...row,
        verified: row.verified === 1,
        food_categories: categoriesMap[row.id] || [],
      }));
      return results;
    } catch (e) {
      console.log(e);
      throw new Error("Something went wrong");
    }
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
