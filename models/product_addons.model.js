const db = require("./");
module.exports.ProductAddons = {
  getProductAddonsByProductId: function (productId) {
    return new Promise((resolve, reject) => {
      db.all(
        "SELECT * FROM product_addons WHERE product_id = ?",
        [productId],
        function (err, rows) {
          if (err) {
            reject("Something went wrong");
          }
          resolve(rows);
        }
      );
    });
  },
  createProductAddons: function ({ productId, addons = [] }) {
    return new Promise((resolve, reject) => {
      const valueString = addons
        .map((x) => `(${productId},"${x.name}",${x.price},"${x.image}")`)
        .join(",");
      db.run(
        "INSERT INTO product_addons (product_id, name, price,image) VALUES " +
          valueString,
        function (err) {
          if (err) {
            reject(err);
          }
          resolve(true);
        }
      );
    });
  },
  updateProductAddon: function ({ addOnId, addon }) {
    return new Promise((resolve, reject) => {
      const dataString = [];
      const data = [];
      for (const key in addon) {
        if (key !== "id") {
          dataString.push(`${key} = ?`);
          data.push(addon[key]);
        }
      }
      console.log({ addOnId });
      db.run(
        "UPDATE product_addons SET " + dataString.join(",") + " WHERE id = ?",
        [...data, addOnId],
        function (err) {
          if (err) {
            reject(err);
          }
          resolve(true);
        }
      );
    });
  },
  deleteProductAddon: function (addOnId) {
    return new Promise((resolve, reject) => {
      db.run(
        "DELETE FROM product_addons WHERE id = ?",
        [addOnId],
        function (err) {
          if (err) {
            reject(err);
          }
          resolve(true);
        }
      );
    });
  },
};
