const db = require(".");
const { Database } = require("../utils/query");
module.exports.Address = {
  getAddressByUserId: async function (user_id) {
    try {
      const addresses = await Database.all(
        "SELECT * FROM addresses WHERE user_id = ?",
        [user_id]
      );
      return addresses || [];
    } catch (e) {
      console.log({ e });
      throw new Error("Something went wrong");
    }
  },
  createAddress: async function ({
    user_id,
    name,
    phone_number,
    street,
    district,
    province,
    selected,
  }) {
    try {
      await Database.run(
        "INSERT INTO addresses (user_id, name, phone_number, street, district, province) VALUES (?, ?, ?, ?, ?,?)",
        [user_id, name, phone_number, street, district, province]
      );
      if (selected) {
        await Database.run(
          `UPDATE addresses SET selected=0 WHERE user_id = ?;`,
          [user_id]
        );
        await Database.run(
          `UPDATE addresses SET selected=1 WHERE id=(SELECT id FROM addresses WHERE user_id=? ORDER BY id DESC LIMIT 1 )`,
          [user_id]
        );
      }
      return true;
    } catch (e) {
      console.log({ e });
      throw new Error("Something went wrong");
    }
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
  deleteAddress: async function ({ address_id, user_id }) {
    try {
      await Database.run("DELETE FROM addresses WHERE id = ?", [address_id]);
      const count = await Database.get(
        "SELECT count(id) from addresses WHERE user_id=? AND selected=1",
        [user_id]
      );
      if (count["count(id)"] === 0) {
        await Database.run(
          `UPDATE addresses SET selected=1 WHERE id=(SELECT id FROM addresses WHERE user_id=? ORDER BY id DESC LIMIT 1 )`,
          [user_id]
        );
      }
      return true;
    } catch (e) {
      console.log({ e });
      throw new Error("Something went wrong");
    }
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
