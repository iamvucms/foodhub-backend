const jwt = require("jsonwebtoken");
module.exports = {
  generateAccessToken(email, isRefresh = false) {
    return jwt.sign(
      email,
      isRefresh ? process.env.JWT_REFRESH_SECRET : process.env.JWT_SECRET
    );
  },
};
