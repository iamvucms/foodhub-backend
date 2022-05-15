const db = require("../models/");
module.exports.Database = {
  run: function (query, params) {
    return new Promise((resolve, reject) => {
      if (!query) {
        return reject("Query is not defined");
      }
      if (!params) {
        db.run(query, function (err) {
          if (err) {
            return reject(err);
          }
          resolve(true);
        });
      } else {
        db.run(query, params, function (err) {
          if (err) {
            return reject(err);
          }
          resolve(true);
        });
      }
    });
  },
  all: function (query, params) {
    return new Promise((resolve, reject) => {
      if (!query) {
        return reject("Query is not defined");
      }
      if (!params) {
        db.all(query, function (err, rows) {
          if (err) {
            return reject(err);
          }
          resolve(rows);
        });
      } else {
        db.all(query, params, function (err, rows) {
          if (err) {
            return reject(err);
          }
          resolve(rows);
        });
      }
    });
  },
  get: function (query, params) {
    return new Promise((resolve, reject) => {
      if (!query) {
        return reject("Query is not defined");
      }
      if (!params) {
        db.get(query, function (err, row) {
          if (err) {
            return reject(err);
          }
          resolve(row);
        });
      } else {
        db.get(query, params, function (err, row) {
          if (err) {
            return reject(err);
          }
          resolve(row);
        });
      }
    });
  },
};
