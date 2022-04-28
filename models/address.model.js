const db = require(".");
module.exports.Address = {
  getAddressByUserId: function (user_id) {
    console.log({ user_id });
    return new Promise((resolve, reject) => {
      db.all(
        "SELECT * FROM addresses WHERE user_id = ?",
        [user_id],
        function (err, rows) {
          if (err) {
            console.log({ err });
            return reject();
          }
          resolve(rows || []);
        }
      );
    });
  },
  addAddress: function ({
    user_id,
    name,
    phone_number,
    street,
    district,
    province,
    selected,
  }) {
    return new Promise((resolve, reject) => {
      db.serialize(async () => {
        db.run(
          "INSERT INTO addresses (user_id, name, phone_number, street, district, province) VALUES (?, ?, ?, ?, ?,?)",
          [user_id, name, phone_number, street, district, province],
          function (err) {
            if (err) {
              console.log({ err });
              return reject(`Something went wrong`);
            }
            if (selected) {
              db.run(
                `UPDATE addresses SET selected=0 WHERE user_id = ?;`,
                [user_id],
                function (err) {
                  if (err) {
                    console.log({ err });
                    return reject(`Something went wrong`);
                  }
                  db.run(
                    `UPDATE addresses SET selected=1 WHERE id=(SELECT id FROM addresses WHERE user_id=? ORDER BY id DESC LIMIT 1 )`,
                    [user_id],
                    function (err) {
                      if (err) {
                        console.log({ err });
                        return reject(`Something went wrong`);
                      }
                      resolve(true);
                    }
                  );
                }
              );
            } else {
              resolve(true);
            }
          }
        );
      });
    });
  },
  updateAddress: function ({
    address_id,
    user_id,
    name,
    phone_number,
    street,
    district,
    province,
    selected,
  }) {
    return new Promise((resolve, reject) => {
      db.serialize(async () => {
        const callback = () => {
          if (selected) {
            db.run(
              "UPDATE addresses SET selected=0 WHERE user_id = ?",
              [user_id],
              function (err) {
                if (err) {
                  console.log({ err });
                  return reject(`Something went wrong`);
                }
                db.run(
                  "UPDATE addresses SET selected=1 WHERE id= ?",
                  [address_id],
                  function (err) {
                    if (err) {
                      console.log({ err });
                      return reject(`Something went wrong`);
                    }
                    resolve(true);
                  }
                );
              }
            );
          } else {
            resolve(true);
          }
        };
        const data = [];
        const dataString = [];
        if (name) {
          data.push(name);
          dataString.push("name = ?");
        }
        if (phone_number) {
          data.push(phone_number);
          dataString.push("phone_number = ?");
        }
        if (street) {
          data.push(street);
          dataString.push("street = ?");
        }
        if (district) {
          data.push(district);
          dataString.push("district = ?");
        }
        if (province) {
          data.push(province);
          dataString.push("province = ?");
        }
        if (data.length > 0) {
          const query = `UPDATE addresses SET ${dataString.join(
            ", "
          )} WHERE id = ?`;
          db.run(query, data.concat(address_id), function (err) {
            if (err) {
              console.log({ err });
              return reject(`Something went wrong`);
            }
            callback();
          });
        } else callback();
      });
    });
  },
  deleteAddress: function ({ address_id, user_id }) {
    return new Promise((resolve, reject) => {
      db.serialize(async () => {
        db.run(
          "DELETE FROM addresses WHERE id = ?",
          [address_id],
          function (err) {
            if (err) {
              console.log({ err });
              return reject(`Something went wrong`);
            }
            db.get(
              "SELECT count(id) from addresses WHERE user_id=? AND selected=1",
              [user_id],
              function (err, row) {
                if (err) {
                  console.log({ err });
                  return reject(`Something went wrong`);
                }
                console.log({ row });
                if (row["count(id)"] === 0) {
                  db.run(
                    `UPDATE addresses SET selected=1 WHERE id=(SELECT id FROM addresses WHERE user_id=? ORDER BY id DESC LIMIT 1 )`,
                    [user_id],
                    function (err) {
                      if (err) {
                        console.log({ err });
                        return reject(`Something went wrong`);
                      }
                      resolve(true);
                    }
                  );
                } else {
                  resolve(true);
                }
              }
            );
          }
        );
      });
    });
  },
  getLatestAddress: function (user_id) {
    return new Promise((resolve, reject) => {
      db.get(
        "SELECT * FROM addresses WHERE user_id = ? ORDER BY id DESC LIMIT 1",
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
};
