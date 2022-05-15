const express = require("express");
const multer = require("multer");
const rootRouter = express.Router();
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads");
  },
  filename: (req, file, cb) => {
    const extension = file.mimetype.split("/")[1];
    const fileId = `${Math.random()}${Math.random()}`;
    cb(null, fileId + "." + extension);
  },
});
const upload = multer({ storage });
const controller = require("../controllers/index.js");
const {
  authenticateTokenMiddleware,
  fakeLaggyMiddleware,
} = require("./middleware.js");
// rootRouter.use("/", fakeLaggyMiddleware);
rootRouter.post("/api/auth", controller.authenticate);
rootRouter.post("/api/auth/register", controller.register);
rootRouter.get("/api/auth/refresh-token", controller.refreshToken);
rootRouter.post("/api/auth/verify-otp", controller.verifyOTP);

rootRouter.use("/api/data", authenticateTokenMiddleware);
rootRouter.get("/api/data", controller.index);
//address
rootRouter.get("/api/data/address", controller.getAddress);
rootRouter.post("/api/data/address/:addressId", controller.updateAddress);
rootRouter.post("/api/data/address", controller.createAddress);
rootRouter.delete("/api/data/address/:addressId", controller.deleteAddress);
//product
rootRouter.get("/api/data/products", controller.getProducts);
rootRouter.get("/api/data/products/:productId", controller.getProductDetail);
rootRouter.get(
  "/api/data/products/:productId/reviews",
  controller.getProductReviews
);
rootRouter.post("/api/data/products", controller.createProduct);
rootRouter.post("/api/data/products/:productId", controller.updateProduct);
rootRouter.delete("/api/data/products/:productId", controller.deleteProduct);
//product addons
rootRouter.post("/api/data/addons/:addOnId", controller.updateProductAddon);
rootRouter.delete("/api/data/addons/:addOnId", controller.deleteProductAddon);
//restaurant
rootRouter.get("/api/data/restaurants", controller.getRestaurants);
rootRouter.get(
  "/api/data/restaurants/:restaurantId",
  controller.getRestaurantDetail
);
rootRouter.get(
  "/api/data/restaurants/:restaurantId/products",
  controller.getRestaurantProducts
);
rootRouter.get(
  "/api/data/restaurants/:restaurantId/reviews",
  controller.getRestaurantReviews
);
rootRouter.post("/api/data/restaurants", controller.createRestaurant);
rootRouter.post(
  "/api/data/restaurants/:restaurantId",
  controller.updateRestaurant
);
//categories
rootRouter.get("/api/data/categories", controller.getCategories);
rootRouter.get(
  "/api/data/categories/:categoryId/products",
  controller.getCategoryProducts
);
//photo upload
rootRouter.post(
  "/api/data/photo",
  upload.single("photo"),
  controller.uploadPhoto
);
rootRouter.post(
  "/api/data/photos",
  upload.array("photos", 5),
  controller.uploadMultiplePhotos
);
rootRouter.delete("/api/data/photos/:filename", controller.deletePhoto);
rootRouter.get("/uploads/:filename", controller.getPhoto);
//orders
rootRouter.get("/api/data/orders", controller.getUserOrders);
rootRouter.get("/api/data/restaurant/orders", controller.getRestaurantOrders);
rootRouter.post("/api/data/orders", controller.createOrder);
rootRouter.post("/api/data/orders/:orderId", controller.updateOrder);
module.exports = rootRouter;
