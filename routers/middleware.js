const jwt = require("jsonwebtoken");
const { JWT_SECRET } = require("../.env");
const { createOTPForUser } = require("../models/otp.model");

function authenticateTokenMiddleware(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (token == null) return res.sendStatus(401);
  jwt.verify(token, JWT_SECRET, (err, email) => {
    if (err) {
      console.log(err);
      return res.json({
        error: "Invalid token",
        err,
      });
    }
    req.user = { email };
    next();
  });
}
function fakeLaggyMiddleware(req, res, next) {
  setTimeout(() => {
    next();
  }, 1500);
}
module.exports = { authenticateTokenMiddleware, fakeLaggyMiddleware };
