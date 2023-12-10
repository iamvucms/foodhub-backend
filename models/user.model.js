const db = require("./");
const md5 = require("md5");
const { Database } = require("../utils/query");
const { OrderStatus } = require("../utils/constants");
module.exports.User = {
  getUser: function (emailOrPhone, password = "") {
    return new Promise((resolve, reject) => {
      db.get(
        "SELECT * FROM users WHERE emailOrPhone = ? AND password = ?",
        [emailOrPhone, md5(password)],
        function (err, row) {
          if (err) {
            console.log({ err });
            return reject();
          }
          resolve(
            row
              ? {
                  ...row,
                  verified: row.verified === 1,
                }
              : row
          );
        }
      );
    });
  },
  getUserByEmailOrPhone: function (emailOrPhone) {
    return new Promise((resolve, reject) => {
      db.get(
        "SELECT * FROM users WHERE emailOrPhone = ?",
        [emailOrPhone],
        function (err, row) {
          if (err) {
            console.log({ err });
            return reject();
          }
          resolve(
            row
              ? {
                  ...row,
                  verified: row.verified === 1,
                  password: undefined,
                }
              : row
          );
        }
      );
    });
  },
  emailToUserId: function (email, shouldReject = true) {
    return new Promise((resolve, reject) => {
      db.get(
        "SELECT id FROM users WHERE emailOrPhone = ?",
        [email],
        function (err, row) {
          if (err) {
            return reject(err);
          }
          if (row) {
            resolve(row.id);
          } else {
            if (shouldReject) {
              reject("User not found");
            } else {
              resolve(null);
            }
          }
        }
      );
    });
  },
  emailToRestaurantId: function (email) {
    return new Promise((resolve, reject) => {
      db.get(
        `SELECT id FROM restaurants WHERE owner_id = (SELECT id FROM users WHERE emailOrPhone = "${email}")`,
        function (err, row) {
          if (err) {
            return reject(err);
          }
          if (row) {
            resolve(row.id);
          } else {
            reject("Restaurant not found");
          }
        }
      );
    });
  },
  getUserByUserId: function (user_id) {
    return new Promise((resolve, reject) => {
      db.get(
        "SELECT * FROM users WHERE id = ?",
        [user_id],
        function (err, row) {
          if (err) {
            console.log({ err });
            return reject();
          }
          resolve(
            row
              ? {
                  ...row,
                  verified: row.verified === 1,
                  password: undefined,
                }
              : row
          );
        }
      );
    });
  },
  addUser: function ({ emailOrPhone, password, name, avatar }) {
    return new Promise((resolve, reject) => {
      db.serialize(async () => {
        db.run(
          "INSERT INTO users (emailOrPhone, password, name, avatar) VALUES (?, ?, ?, ?)",
          [emailOrPhone, md5(password), name, avatar],
          function (err) {
            if (err) {
              console.log({ err });
              return reject(`Can't register with your information`);
            }
          }
        );
        db.get(
          "SELECT * FROM users WHERE emailOrPhone = ?",
          [emailOrPhone],
          function (err, row) {
            if (err) {
              console.log({ err });
              return reject(`Can't register with your information`);
            }
            resolve(
              row
                ? {
                    ...row,
                    verified: row.verified === 1,
                    password: undefined,
                  }
                : row
            );
          }
        );
      });
    });
  },
  updateUser: async function ({ user_id, name, verified, avatar, password }) {
    try {
      const data = [];
      const dataString = [];
      if (name) {
        data.push(name);
        dataString.push("name = ?");
      }
      if (typeof verified === "boolean") {
        data.push(verified ? 1 : 0);
        dataString.push("verified = ?");
      }
      if (avatar) {
        data.push(avatar);
        dataString.push("avatar = ?");
      }
      if (password) {
        data.push(md5(password));
        dataString.push("password = ?");
      }
      const query = `UPDATE users SET ${dataString.join(", ")} WHERE id = ?`;
      await Database.run(query, data.concat([user_id]));
      const user = await Database.get("SELECT * FROM users WHERE id = ?", [
        user_id,
      ]);
      return user
        ? {
            ...user,
            verified: user.verified === 1,
            password: undefined,
          }
        : user;
    } catch (e) {
      console.log(e);
      throw new Error("Something went wrong");
    }
  },
  getUsersByRestaurantId: async function (restaurantId) {
    try {
      const users = await Database.all(
        `SELECT users.*, count(orders.id) as total_orders FROM users INNER JOIN orders ON users.id = orders.user_id WHERE orders.res_id = ? GROUP BY users.id`,
        [restaurantId]
      );
      const extraInfors = await Database.all(
        "SELECT user_id, SUM(total_price) as total_spent,count(id) as total_completed FROM orders WHERE res_id = ? AND status_code = ? GROUP BY user_id",
        [restaurantId, OrderStatus.DELIVERED]
      );
      const customers = users
        .map((user) => {
          const extraInfo = extraInfors.find(
            (extra) => extra.user_id === user.id
          );
          return {
            ...user,
            total_spent: extraInfo?.total_spent || 0,
            total_orders: user.total_orders,
            total_completed: extraInfo?.total_completed || 0,
          };
        })
        .sort((a, b) => b.total_spent - a.total_spent);
      return customers;
    } catch (e) {
      console.log(e);
      throw new Error("Something went wrong");
    }
  },
};
