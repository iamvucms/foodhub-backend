const db = require("./");
module.exports.Category = {
  getCategories: function () {
    return new Promise((resolve, reject) => {
      db.all("SELECT * FROM categories", function (err, rows) {
        if (err) {
          console.log({ err });
          reject("Something went wrong");
        }
        resolve(rows);
      });
    });
  },
};
