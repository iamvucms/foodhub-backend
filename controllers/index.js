const { User } = require("../models/user.model");
const { OTP } = require("../models/otp.model");
const { generateAccessToken } = require("../utils");
const { Address } = require("../models/address.model");
const { Product } = require("../models/product.model");
const { Review } = require("../models/review.model");
const { Restaurant } = require("../models/restaurant.model");
const { Category } = require("../models/category.model");
const { ProductAddons } = require("../models/product_addons.model");
const path = require("path");
const fs = require("fs");
const { Order } = require("../models/order.model");
const {
  isEmail,
  isVietnamesePhoneNumber,
  isPassword,
  isValidName,
  isValidMediaUrl,
  isValidVerified,
} = require("../utils/validation");
const tokenList = {};
module.exports = {
  getUser: async function (req, res) {
    try {
      const userInfo = await User.getUserByEmailOrPhone(req.user.email);
      const restaurant = await Restaurant.getRestaurantByUserId(userInfo.id);
      res.json({
        success: true,
        data: {
          ...userInfo,
          user_id: userInfo.id,
          restaurant,
        },
      });
    } catch (e) {
      res.json({
        success: false,
        error: e,
      });
    }
  },
  authenticate: async function (req, res) {
    try {
      const { emailOrPhone = "", password } = req.body || {};
      const _emailOrPhone = emailOrPhone.trim().toLowerCase();
      if (!_emailOrPhone) {
        return res.status(400).json({
          success: false,
          error: "Email or phone is required",
        });
      }
      if (!isEmail(_emailOrPhone) && !isVietnamesePhoneNumber(_emailOrPhone)) {
        return res.status(422).json({
          success: false,
          error: "Email or phone is invalid format",
        });
      }
      if (!password) {
        return res.status(400).json({
          success: false,
          error: "Password is required",
        });
      }

      const user = await User.getUser(_emailOrPhone, password);
      if (user) {
        const restaurant = await Restaurant.getRestaurantByUserId(user.id);
        const accessToken = generateAccessToken(_emailOrPhone);
        const refreshToken = generateAccessToken(_emailOrPhone, true);
        tokenList[refreshToken] = {
          accessToken,
        };
        res.json({
          success: true,
          data: {
            ...user,
            user_id: user.id,
            accessToken,
            refreshToken,
            restaurant,
          },
        });
      } else {
        res.status(400).json({
          success: false,
          error: "Email or password is incorrect",
        });
      }
    } catch (e) {
      res.status(400).json({
        success: false,
        error: "Something went wrong",
      });
    }
  },
  register: async function (req, res) {
    const { emailOrPhone = "", password, name, avatar } = req.body || {};
    try {
      const _emailOrPhone = emailOrPhone.trim().toLowerCase();
      if (!_emailOrPhone) {
        return res.status(400).json({
          success: false,
          error: "Email or phone is required",
        });
      }
      if (!isEmail(_emailOrPhone) && !isVietnamesePhoneNumber(_emailOrPhone)) {
        return res.status(422).json({
          success: false,
          error: "Email or phone is invalid format",
        });
      }
      if (!password) {
        return res.status(400).json({
          success: false,
          error: "Password is required",
        });
      }
      if (!isPassword(password)) {
        return res.status(422).json({
          success: false,
          error:
            "Password must be at least 8 characters and contain both special characters, numbers and letters",
        });
      }
      if (!name) {
        return res.status(400).json({
          success: false,
          error: "Name is required",
        });
      }
      if (!isValidName(name)) {
        return res.status(422).json({
          success: false,
          error:
            "Name length must be at least 5 characters and not contain special characters",
        });
      }
      if (!avatar) {
        return res.status(400).json({
          success: false,
          error: "Avatar is required",
        });
      }
      if (!isValidMediaUrl(avatar)) {
        return res.status(422).json({
          success: false,
          error: "Avatar is invalid format",
        });
      }
      const existingUserId = await User.emailToUserId(_emailOrPhone, false);
      if (typeof existingUserId === "number") {
        return res.status(422).json({
          success: false,
          error: "Email or phone is already registered",
        });
      }
      const user = await User.addUser({
        emailOrPhone: _emailOrPhone,
        password,
        name,
        avatar,
      });
      const sentOTP = await OTP.createOTPForUser(user.id, _emailOrPhone);
      if (sentOTP) {
        res.json({
          success: true,
          data: {
            user_id: user.id,
          },
        });
      } else {
        throw new Error("Something went wrong");
      }
    } catch (e) {
      res.json({
        success: false,
        error: e,
      });
    }
  },
  refreshToken: function (req, res) {
    const { emailOrPhone, refreshToken } = req.body || {};
    if (emailOrPhone && refreshToken in tokenList) {
      const accessToken = generateAccessToken(emailOrPhone);
      res.json({
        success: true,
        data: {
          accessToken,
        },
      });
      tokenList[refreshToken].accessToken = accessToken;
    } else {
      res.json({
        success: false,
        error: "Invalid email or password",
      });
    }
  },
  verifyOTP: async function (req, res) {
    try {
      const { user_id, otp } = req.body || {};
      const verified = await OTP.checkOTP(user_id, otp);
      if (verified) {
        const user = await User.updateUser({ user_id, verified: true });
        const accessToken = generateAccessToken(user.emailOrPhone);
        const refreshToken = generateAccessToken(user.emailOrPhone, true);
        tokenList[refreshToken] = {
          accessToken,
        };
        res.json({
          success: true,
          data: {
            ...user,
            user_id: user.id,
            accessToken,
            refreshToken,
          },
        });
      } else {
        throw new Error("Invalid OTP");
      }
    } catch (e) {
      res.json({
        success: false,
        error: e,
      });
    }
  },
  updateUser: async function (req, res) {
    try {
      const { name, avatar, password, verified } = req.body || {};
      if (password && !isPassword(password)) {
        return res.status(422).json({
          success: false,
          error:
            "Password must be at least 8 characters and contain both special characters, numbers and letters",
        });
      }
      if (name && !isValidName(name)) {
        return res.status(422).json({
          success: false,
          error:
            "Name length must be at least 5 characters and not contain special characters or digits",
        });
      }
      if (avatar && !isValidMediaUrl(avatar)) {
        return res.status(422).json({
          success: false,
          error: "Avatar is invalid format",
        });
      }
      if (verified !== undefined && !isValidVerified(verified)) {
        return res.status(422).json({
          success: false,
          error: "Verified must be true or false",
        });
      }
      const userId = await User.emailToUserId(req.user.email);
      const user = await User.updateUser({
        user_id: userId,
        name,
        avatar,
        password,
        verified,
      });
      res.json({
        success: true,
        data: {
          ...user,
          user_id: user.id,
        },
      });
    } catch (e) {
      res.json({
        success: false,
        error: e,
      });
    }
  },
  getAddress: async function (req, res) {
    try {
      const userId = await User.emailToUserId(req.user.email);
      const addresses = await Address.getAddressByUserId(userId);
      res.json({
        success: true,
        data: addresses,
      });
    } catch (e) {
      res.json({
        success: false,
        error: e,
      });
    }
  },
  updateAddress: async function (req, res) {
    try {
      const userId = await User.emailToUserId(req.user.email);
      const { address } = req.body || {};
      const addressId = req.params.addressId;
      const updated = await Address.updateAddress({
        address_id: addressId,
        user_id: userId,
        ...address,
      });
      res.json({
        success: updated,
        // data: address,
      });
    } catch (e) {
      res.json({
        success: false,
        error: e,
      });
    }
  },
  createAddress: async function (req, res) {
    try {
      const { address } = req.body || {};
      const userId = await User.emailToUserId(req.user.email);
      const created = await Address.createAddress({
        ...address,
        user_id: userId,
      });
      const addressList = await Address.getAddressByUserId(userId);
      res.json({
        success: created,
        data: addressList,
      });
    } catch (e) {
      res.json({
        success: false,
        error: e,
      });
    }
  },
  deleteAddress: async function (req, res) {
    try {
      const userId = await User.emailToUserId(req.user.email);
      const addressId = req.params.addressId;
      const isExist = await Address.checkExistAddress(addressId);
      if (!isExist) {
        return res.status(422).json({
          success: false,
          error: "Address not found",
        });
      }
      const isOwner = await Address.getIsOwner({
        address_id: addressId,
        user_id: userId,
      });
      if (!isOwner) {
        return res.status(403).json({
          success: false,
          error: "You are not owner of this address",
        });
      }
      const deleted = await Address.deleteAddress({
        address_id: addressId,
        user_id: userId,
      });
      res.json({
        success: deleted,
      });
    } catch (e) {
      res.json({
        success: false,
        error: e,
      });
    }
  },
  getProducts: async function (req, res) {
    try {
      const { page = 0, limit = 10, q, orderBy, orderType } = req.query;
      const products = await Product.getProducts({
        page,
        limit,
        q,
        orderBy,
        orderType,
      });
      res.json({
        success: true,
        data: products,
      });
    } catch (e) {
      res.json({
        success: false,
        error: e,
      });
    }
  },
  getSuggestProducts: async function (req, res) {
    try {
      const { page = 0, limit = 10 } = req.query;
      const { categoryIds, restaurantIds, skipProductIds } = req.body || {};
      const suggestProducts = await Product.getSuggestProducts({
        categoryIds,
        restaurantIds,
        skipProductIds,
        page,
        limit,
      });
      return res.json({
        success: true,
        data: suggestProducts,
      });
    } catch (e) {
      res.json({
        success: false,
        error: e,
      });
    }
  },
  getProductDetail: async function (req, res) {
    try {
      const { productId } = req.params;
      const product = await Product.getProductById(productId);
      res.json({
        success: true,
        data: product,
      });
    } catch (e) {
      res.json({
        success: false,
        error: e,
      });
    }
  },
  createProduct: async function (req, res) {
    try {
      const { product, addons = [] } = req.body || {};
      if (
        !product.name ||
        !product.description ||
        !product.price ||
        !product.cat_id ||
        !product.image ||
        !product.res_id
      ) {
        throw new Error("Missing required fields");
      } else {
        const created = await Product.createProduct(product);
        if (created) {
          const lastProductId = await Product.getLatestProductId();
          if (addons.length > 0) {
            await ProductAddons.createProductAddons({
              productId: lastProductId,
              addons,
            });
          }
          const createdProduct = await Product.getLatestProduct();
          res.json({
            success: true,
            data: createdProduct,
          });
        } else {
          throw new Error("Something went wrong");
        }
      }
    } catch (e) {
      res.json({
        success: false,
        error: e,
      });
    }
  },
  updateProduct: async function (req, res) {
    try {
      const { productId } = req.params;
      const { ...product } = req.body || {};
      if (Object.keys(product).length === 0) {
        throw new Error("Missing required fields");
      }
      const updated = await Product.updateProduct({ product, productId });
      const updatedProduct = await Product.getProductById(productId);
      res.json({
        success: updated,
        data: updatedProduct,
      });
    } catch (e) {
      res.json({
        success: false,
        error: e,
      });
    }
  },
  deleteProduct: async function (req, res) {
    try {
      const { productId } = req.params;
      const deleted = await Product.deleteProduct(productId);
      res.json({
        success: deleted,
      });
    } catch (e) {
      res.json({
        success: false,
        error: e,
      });
    }
  },
  //end product controllers
  getRestaurants: async function (req, res) {
    try {
      const { page = 0, limit = 10, q } = req.query;
      const restaurants = await Restaurant.getRestaurants({ page, limit, q });
      res.json({
        success: true,
        data: restaurants,
      });
    } catch (e) {
      res.json({
        success: false,
        error: e,
      });
    }
  },
  getRestaurantDetail: async function (req, res) {
    try {
      const { restaurantId } = req.params;
      const restaurant = await Restaurant.getRestaurantById(restaurantId);
      res.json({
        success: true,
        data: restaurant,
      });
    } catch (e) {
      res.json({
        success: false,
        error: e,
      });
    }
  },
  getRestaurantProducts: async function (req, res) {
    try {
      const { restaurantId } = req.params;
      const { limit = 10, page = 0, categoryId } = req.query;
      const products = await Product.getProductsByRestaurantId({
        resId: restaurantId,
        page,
        limit,
        categoryId,
      });
      res.json({
        success: true,
        data: products,
      });
    } catch (e) {
      res.json({
        success: false,
        error: e,
      });
    }
  },
  getRestaurantUsers: async function (req, res) {
    try {
      const { restaurantId } = req.params;
      const users = await User.getUsersByRestaurantId(restaurantId);
      res.json({
        success: true,
        data: users,
      });
    } catch (e) {
      res.json({
        success: false,
        error: e,
      });
    }
  },
  createRestaurant: async function (req, res) {
    try {
      const { ...restaurant } = req.body || {};
      console.log(restaurant);
      const userId = await User.emailToUserId(req.user.email);
      if (
        !restaurant.name ||
        !restaurant.logo ||
        !restaurant.address ||
        !restaurant.cover_image ||
        isNaN(restaurant.delivery_fee)
      ) {
        throw new Error("Missing required fields");
      }
      const created = await Restaurant.createRestaurant({
        userId,
        restaurant,
      });
      if (created) {
        const createdRestaurant = await Restaurant.getLatestRestaurant();
        res.json({
          success: true,
          data: createdRestaurant,
        });
      } else {
        throw new Error("Something went wrong");
      }
    } catch (e) {
      console.log(e);
      res.json({
        success: false,
        error: e,
      });
    }
  },
  updateRestaurant: async function (req, res) {
    try {
      const { restaurantId } = req.params;
      const { ...restaurant } = req.body || {};
      if (Object.keys(restaurant).length === 0) {
        throw new Error("Missing required fields");
      }
      const updatedRestaurant = await Restaurant.updateRestaurant({
        restaurant,
        restaurantId,
      });
      res.json({
        success: true,
        data: updatedRestaurant,
      });
    } catch (e) {
      res.json({
        success: false,
        error: e,
      });
    }
  },
  getCategories: async function (_, res) {
    try {
      const categories = await Category.getCategories();
      res.json({
        success: true,
        data: categories,
      });
    } catch (e) {
      res.json({
        success: false,
        error: e,
      });
    }
  },
  getCategoryProducts: async function (req, res) {
    try {
      const { categoryId } = req.params;
      const { limit = 10, page = 0, orderType, orderBy, q } = req.query;
      const products = await Product.getProductsByCategoryId({
        catId: categoryId,
        page,
        limit,
        orderBy,
        orderType,
        q,
      });
      res.json({
        success: true,
        data: products,
      });
    } catch (e) {
      res.json({
        success: false,
        error: e,
      });
    }
  },
  //production addon controllers
  createProductAddons: async function (req, res) {
    try {
      const { productId, addons } = req.body;
      const created = await ProductAddons.createProductAddons({
        productId,
        addons,
      });
      res.json({
        success: created,
      });
    } catch (e) {
      res.json({
        success: false,
        error: e,
      });
    }
  },
  updateProductAddon: async function (req, res) {
    try {
      const { addOnId } = req.params;
      const { ...addon } = req.body || {};
      if (Object.keys(addon).length === 0) {
        throw new Error("Missing required fields");
      }
      const updated = await ProductAddons.updateProductAddon({
        addOnId,
        addon,
      });
      res.json({
        success: updated,
      });
    } catch (e) {
      res.json({
        success: false,
        error: e,
      });
    }
  },
  deleteProductAddon: async function (req, res) {
    try {
      const { addOnId } = req.params;
      const deleted = await ProductAddons.deleteProductAddon(addOnId);
      res.json({
        success: deleted,
      });
    } catch (e) {
      res.json({
        success: false,
        error: e,
      });
    }
  },
  //photo controllers
  uploadPhoto: async function (req, res) {
    try {
      res.json({
        success: true,
        data: {
          uri: `http://${req.headers.host}/uploads/${req.file.filename}`,
        },
      });
    } catch (e) {
      console.log(e);
      res.json({
        success: false,
        error: e,
      });
    }
  },
  uploadMultiplePhotos: async function (req, res) {
    try {
      const data = req.files.map((file) => ({
        uri: `http://${req.headers.host}/uploads/${file.filename}`,
      }));
      res.json({
        success: true,
        data,
      });
    } catch (e) {
      console.log(e);
      res.json({
        success: false,
        error: e,
      });
    }
  },
  deletePhoto: async function (req, res) {
    try {
      const photoPath = path.join(
        __dirname,
        "../uploads/" + req.params.filename
      );
      fs.unlinkSync(photoPath);
      res.json({
        success: true,
      });
    } catch (e) {
      res.json({
        success: false,
        error: e,
      });
    }
  },
  getPhoto: async function (req, res) {
    try {
      const photoPath = path.join(
        __dirname,
        "../uploads/" + req.params.filename
      );
      res.sendFile(photoPath);
    } catch (e) {
      res.json({
        success: false,
        error: e,
      });
    }
  },
  //orders controllers
  getUserOrders: async function (req, res) {
    try {
      const userId = await User.emailToUserId(req.user.email);
      const { limit = 10, page = 0, history = 0 } = req.query;
      const orders = await Order.getOrdersByUserId({
        userId,
        limit,
        page,
        isHistory: parseInt(history) === 1,
      });
      res.json({
        success: true,
        data: orders,
      });
    } catch (e) {
      res.json({
        success: false,
        error: e,
      });
    }
  },
  getRestaurantOrders: async function (req, res) {
    try {
      const restaurantId = await User.emailToRestaurantId(req.user.email);
      const { limit = 10, page = 0, status } = req.query;
      if (restaurantId) {
        const orders = await Order.getOrdersByRestaurantId({
          restaurantId,
          page,
          limit,
          status,
        });
        res.json({
          success: true,
          data: orders,
        });
      }
    } catch (e) {
      res.json({
        success: false,
        error: e,
      });
    }
  },
  createOrder: async function (req, res) {
    try {
      const { products, address, paymentMethod } = req.body || {};
      const userId = await User.emailToUserId(req.user.email);
      if (!products || !address) {
        throw new Error("Missing required fields");
      }
      const resIds = [];
      products.forEach((product) => {
        if (!resIds.includes(product.res_id)) {
          resIds.push(product.res_id);
        }
      });
      const created = await Order.createOrder({
        userId,
        address,
        products,
        paymentMethod,
      });
      if (created) {
        const orders = await Order.getLatestOrderByUserId({
          userId,
          limit: resIds.length,
        });
        res.json({
          success: true,
          data: orders,
        });
      } else {
        throw new Error("Something went wrong");
      }
    } catch (e) {
      console.log(e);
      res.json({
        success: false,
        error: e,
      });
    }
  },
  updateOrder: async function (req, res) {
    try {
      const { orderId } = req.params;
      const { ...order } = req.body || {};
      const userId = await User.emailToUserId(req.user.email);
      const restaurantId = await User.emailToRestaurantId(req.user.email);

      if (Object.keys(order).length === 0) {
        throw new Error("Missing required fields");
      } else {
        const updated = await Order.updateOrder({
          orderId,
          order,
          userId,
          restaurantId,
        });
        res.json({
          success: updated,
        });
      }
    } catch (e) {
      res.json({
        success: false,
        error: e,
      });
    }
  },
  //review controllers
  createRestaurantReview: async function (req, res) {
    try {
      const { restaurantId } = req.params;
      const userId = await User.emailToUserId(req.user.email);
      const { review, orderId } = req.body || {};
      if (Object.keys(review).length === 0) {
        throw new Error("Missing required fields");
      } else {
        const created = await Review.createReview({
          orderId,
          review,
          userId,
          restaurantId,
        });
        if (created) {
          const review = await Review.getLatestReview({
            orderId,
          });
          res.json({
            success: true,
            data: review,
          });
        } else {
          throw new Error("Something went wrong");
        }
      }
    } catch (e) {
      res.json({
        success: false,
        error: e,
      });
    }
  },
  createProductReview: async function (req, res) {
    try {
      const { productId } = req.params;
      const userId = await User.emailToUserId(req.user.email);
      const { review, orderId } = req.body || {};
      if (Object.keys(review).length === 0) {
        throw new Error("Missing required fields");
      } else {
        const created = await Review.createReview({
          orderId,
          review,
          userId,
          productId,
        });
        if (created) {
          const review = await Review.getLatestReview({
            orderId,
          });
          res.json({
            success: true,
            data: review,
          });
        } else {
          throw new Error("Something went wrong");
        }
      }
    } catch (e) {
      res.json({
        success: false,
        error: e,
      });
    }
  },
  deleteReview: async function (req, res) {
    try {
      const { reviewId } = req.params;
      const userId = await User.emailToUserId(req.user.email);
      const deleted = await Review.deleteReview({
        reviewId,
        userId,
      });
      res.json({
        success: deleted,
      });
    } catch (e) {
      res.json({
        success: false,
        error: e,
      });
    }
  },
  getProductReviews: async function (req, res) {
    try {
      const { productId } = req.params;
      const { limit = 10, page = 0 } = req.query;
      const reviews = await Review.getReviewsByProductId({
        productId,
        limit,
        page,
      });
      res.json({
        success: true,
        data: reviews,
      });
    } catch (e) {
      res.json({
        success: false,
        error: e,
      });
    }
  },
  getRestaurantReviews: async function (req, res) {
    try {
      const { restaurantId } = req.params;
      const { limit = 10, page = 0 } = req.query;
      const reviews = await Review.getReviewsByRestaurantId({
        resId: restaurantId,
        page,
        limit,
      });
      res.json({
        success: true,
        data: reviews,
      });
    } catch (e) {
      res.json({
        success: false,
        error: e,
      });
    }
  },
};
