const jwt = require("jsonwebtoken");
const { JWT_REFRESH_SECRET, JWT_SECRET } = require("../.env");
module.exports = {
  generateAccessToken(email, isRefresh = false) {
    return jwt.sign(email, isRefresh ? JWT_REFRESH_SECRET : JWT_SECRET);
  },
};
