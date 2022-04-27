const express = require("express");
const rootRouter = express.Router();
const controller = require("../controllers/index.js");
const {
  authenticateTokenMiddleware,
  fakeLaggyMiddleware,
} = require("./middleware.js");
rootRouter.use("/", fakeLaggyMiddleware);
rootRouter.post("/api/auth", controller.authenticate);
rootRouter.post("/api/auth/register", controller.register);
rootRouter.get("/api/auth/refresh-token", controller.refreshToken);
rootRouter.post("/api/auth/verify-otp", controller.verifyOTP);

rootRouter.use("/api/data", authenticateTokenMiddleware);
rootRouter.get("/api/data", controller.index);
//address
rootRouter.get("/api/data/address", controller.getAddress);
rootRouter.post("/api/data/address/:addressId", controller.updateAddress);

module.exports = rootRouter;
