const { User } = require("../models/user.model");
const { OTP } = require("../models/otp.model");
const { generateAccessToken } = require("../utils");
const { Address } = require("../models/address.model");
const { Product } = require("../models/product.model");
const { Review } = require("../models/review.model");
const tokenList = {};
module.exports = {
  index: function (req, res) {
    res.send(req.user);
  },
  authenticate: async function (req, res) {
    const { emailOrPhone, password } = req.body || {};
    const user = await User.getUser(emailOrPhone, password);
    if (user) {
      const accessToken = generateAccessToken(emailOrPhone);
      const refreshToken = generateAccessToken(emailOrPhone, true);
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
      res.json({
        success: false,
        error: "Invalid email or password",
      });
    }
  },
  register: async function (req, res) {
    const { emailOrPhone, password, name, avatar } = req.body || {};
    try {
      const user = await User.addUser({ emailOrPhone, password, name, avatar });
      const sentOTP = await OTP.createOTPForUser(user.id, emailOrPhone);
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
      res.sendStatus(401);
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
      const created = await Address.addAddress({
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
      const { page = 0, limit = 10 } = req.query;
      const products = await Product.getProducts({ page, limit });
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
  getProductReviews: async function (req, res) {
    try {
      const { productId } = req.params;
      const reviews = await Review.getReviewsByProductId(productId);
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

  getRestaurants: async function (req, res) {},
  getRestaurantDetail: async function (req, res) {},
  getRestaurantProducts: async function (req, res) {},
  getRestaurantReviews: async function (req, res) {},

  getCategories: async function (req, res) {},
  getCategoryProducts: async function (req, res) {},
};
