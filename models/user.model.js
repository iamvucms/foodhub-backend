const db = require("./");
const md5 = require("md5");
module.exports.User = {
  getUser: function (emailOrPhone, password) {
    return new Promise((resolve, reject) => {
      db.get(
        "SELECT * FROM users WHERE emailOrPhone = ? AND password = ?",
        [emailOrPhone, md5(password)],
        function (err, row) {
          if (err) {
            console.log({ err });
            return reject();
          }
          resolve(row);
        }
      );
    });
  },
  emailToUserId: function (email) {
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
            reject("User not found");
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
          resolve(row);
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
            resolve(row);
          }
        );
      });
    });
  },
  updateUser: function ({ user_id, name, verified, avatar, password }) {
    return new Promise((resolve, reject) => {
      db.serialize(() => {
        const data = [];
        const dataString = [];
        if (name) {
          data.push(name);
          dataString.push("name = ?");
        }
        if (verified) {
          data.push(verified);
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
        db.run(query, data.concat([user_id]), function (err) {
          if (err) {
            console.log({ err });
            return reject(`Something went wrong`);
          }
          db.get(
            "SELECT * FROM users WHERE id = ?",
            [user_id],
            function (err, row) {
              if (err) {
                console.log({ err });
                return reject("Something went wrong");
              }
              resolve(row);
            }
          );
        });
      });
    });
  },
};
