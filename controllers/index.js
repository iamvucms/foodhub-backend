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
      const { page = 0, limit = 10 } = req.query;
      const restaurants = await Restaurant.getRestaurants({ page, limit });
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
      const { limit = 10, page = 0 } = req.query;
      const products = await Product.getProductsByRestaurantId({
        resId: restaurantId,
        page,
        limit,
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
      const { limit = 10, page = 0, orderType, orderBy } = req.query;
      const products = await Product.getProductsByCategoryId({
        catId: categoryId,
        page,
        limit,
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
  //production addon controllers
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
          uri: `http://localhost:3000/uploads/${req.file.filename}`,
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
        uri: `http://localhost:3000/uploads/${file.filename}`,
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
};
