const { Database } = require("../utils/query");
const db = require("./");
module.exports.Review = {
  getReviewsByProductId: function ({ productId, limit = 10, page = 0 }) {
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
  createReview: async function ({
    review,
    userId,
    orderId,
    restaurantId,
    productId,
  }) {
    try {
      const timestamp = new Date().getTime();
      await Database.run(
        "INSERT INTO reviews (content,rating,reviewer_id,product_id,order_id,res_id,created_at) VALUES (?,?,?,?,?,?,?)",
        [
          review.content,
          review.rating,
          userId,
          productId,
          orderId,
          restaurantId,
          timestamp,
        ]
      );
      return true;
    } catch (e) {
      console.log({ e });
      throw new Error("Something went wrong");
    }
  },
  getLatestReview: async function ({ orderId }) {
    try {
      const review = await Database.get(
        `SELECT reviews.*,name as reviewer_name,avatar as reviewer_avatar FROM reviews inner join users ON(reviews.reviewer_id=users.id) WHERE order_id = ? order by reviews.id DESC LIMIT 1`,
        [orderId]
      );
      return review;
    } catch (e) {
      console.log({ e });
      throw new Error("Something went wrong");
    }
  },
  deleteReview: async function ({ reviewId, userId }) {
    try {
      await Database.run(
        "DELETE FROM reviews WHERE id = ? AND reviewer_id = ?",
        [reviewId, userId]
      );
      return true;
    } catch (e) {
      console.log({ e });
      throw new Error("Something went wrong");
    }
  },
};
