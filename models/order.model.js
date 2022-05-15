const { Restaurant } = require("./restaurant.model");
const { OrderStatus, taxFeePercentage } = require("../utils/constants");
const { Database } = require("../utils/query");
const getLatestOrderIdByUserId = async function (userId, restaurantId) {
  try {
    const query = !!restaurantId
      ? `SELECT * FROM orders WHERE user_id = ? AND res_id = ? ORDER BY id DESC LIMIT 1`
      : `SELECT * FROM orders WHERE user_id = ? ORDER BY id DESC LIMIT 1`;
    const data = !!restaurantId ? [userId, restaurantId] : [userId];
    const order = await Database.get(query, data);
    return order.id;
  } catch (e) {
    console.log({ e });
    throw new Error("Something went wrong");
  }
};
module.exports.Order = {
  getOrdersByUserId: async function ({ userId, limit = 10, page = 0 }) {
    try {
      const orders = await Database.all(
        "SELECT orders.*,restaurants.name as restaurant_name,restaurants.logo as restaurant_logo FROM orders inner join restaurants ON(orders.res_id=restaurants.id) WHERE orders.user_id = ? ORDER BY orders.id DESC LIMIT ? OFFSET ?",
        [userId, limit, limit * page]
      );
      const orderIds = orders.map((row) => row.id).join(",");
      const orderDetails = await Database.all(
        "SELECT order_product_details.*,products.name,products.image FROM order_product_details inner join products ON(order_product_details.product_id=products.id) WHERE order_id IN(" +
          orderIds +
          ")"
      );
      const orderDetailsJson = {};
      orderDetails.forEach((orderDetail) => {
        if (orderDetailsJson[orderDetail.order_id]) {
          orderDetailsJson[orderDetail.order_id].push(orderDetail);
        } else {
          orderDetailsJson[orderDetail.order_id] = [orderDetail];
        }
      });
      const orderAddons = await Database.all(
        "SELECT order_product_addons_details.*,product_addons.name,product_addons.image FROM order_product_addons_details inner join product_addons ON(order_product_addons_details.addon_id=product_addons.id) WHERE order_id IN(" +
          orderIds +
          ")"
      );
      //group addon by product_id
      const result = orders.map((order) => {
        const addonsInOrder = orderAddons.filter(
          (addon) => addon.order_id === order.id
        );
        const productsInOrder = orderDetailsJson[order.id] || [];
        productsInOrder.forEach((product) => {
          product.addons = addonsInOrder.filter(
            (addon) => addon.product_id === product.product_id
          );
        });
        return {
          ...order,
          products: productsInOrder,
        };
      });
      return result;
    } catch (e) {
      console.log({ e });
      throw new Error("Something went wrong");
    }
  },
  getOrdersByRestaurantId: async function ({
    restaurantId,
    limit = 10,
    page = 0,
  }) {
    try {
      const orders = await Database.all(
        "SELECT orders.*,users.name as user_name,users.avatar as user_avatar FROM orders inner join users ON(orders.user_id=users.id) WHERE orders.res_id = ? ORDER BY orders.id DESC LIMIT ? OFFSET ?",
        [restaurantId, limit, page * limit]
      );
      const orderIds = orders.map((row) => row.id).join(",");
      const orderDetails = await Database.all(
        "SELECT order_product_details.*,products.name,products.image FROM order_product_details inner join products ON(order_product_details.product_id=products.id) WHERE order_id IN(" +
          orderIds +
          ")"
      );
      const orderDetailsJson = {};
      orderDetails.forEach((orderDetail) => {
        if (orderDetailsJson[orderDetail.order_id]) {
          orderDetailsJson[orderDetail.order_id].push(orderDetail);
        } else {
          orderDetailsJson[orderDetail.order_id] = [orderDetail];
        }
      });
      const orderAddons = await Database.all(
        "SELECT order_product_addons_details.*,product_addons.name,product_addons.image FROM order_product_addons_details inner join product_addons ON(order_product_addons_details.addon_id=product_addons.id) WHERE order_id IN(" +
          orderIds +
          ")"
      );
      //group addon by product_id
      const result = orders.map((order) => {
        const addonsInOrder = orderAddons.filter(
          (addon) => addon.order_id === order.id
        );
        const productsInOrder = orderDetailsJson[order.id] || [];
        productsInOrder.forEach((product) => {
          product.addons = addonsInOrder.filter(
            (addon) => addon.product_id === product.product_id
          );
        });
        return {
          ...order,
          products: productsInOrder,
        };
      });
      return result;
    } catch (e) {
      console.log({ e });
      throw new Error("Something went wrong");
    }
  },
  createOrder: async function ({ userId, products, address }) {
    try {
      //group products by restaurant_id
      const productsByRestaurant = {};
      products.forEach((product) => {
        if (productsByRestaurant[product.res_id]) {
          productsByRestaurant[product.res_id].push(product);
        } else {
          productsByRestaurant[product.res_id] = [product];
        }
      });
      await Promise.all(
        Object.keys(productsByRestaurant).map(async (restaurantId) => {
          const restaurant = await Restaurant.getRestaurantById(restaurantId);
          const products = productsByRestaurant[restaurantId];
          const productPrice = products.reduce((acc, product) => {
            return (
              acc +
              product.price * product.quantity +
              product.addons.reduce((acc, addon) => {
                return acc + addon.price * addon.quantity;
              }, 0)
            );
          }, 0);
          const totalPrice =
            productPrice +
            restaurant.delivery_fee +
            taxFeePercentage * productPrice;
          const timestamp = new Date().getTime();
          await Database.run(
            "INSERT INTO orders (user_id,address_text,status_code,delivery_fee,res_id,total_price,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?)",
            [
              userId,
              address,
              OrderStatus.PENDING,
              restaurant.delivery_fee,
              restaurantId,
              totalPrice,
              timestamp,
              timestamp,
            ]
          );
          const orderId = await getLatestOrderIdByUserId(userId, restaurantId);
          await Promise.all(
            products.map(async (product) => {
              await Database.run(
                "INSERT INTO order_product_details (order_id,product_id,quantity,unit_price) VALUES (?,?,?,?)",
                [orderId, product.id, product.quantity, product.price]
              );
              await Promise.all(
                product.addons.map(async (addon) => {
                  await Database.run(
                    "INSERT INTO order_product_addons_details (order_id,product_id,addon_id,addon_quantity,addon_unit_price) VALUES (?,?,?,?,?)",
                    [orderId, product.id, addon.id, addon.quantity, addon.price]
                  );
                })
              );
            })
          );
        })
      );
      return true;
    } catch (e) {
      console.log(e);
      throw new Error("Something went wrong");
    }
  },
  getLatestOrderByUserId: async function ({ userId, limit = 1 }) {
    try {
      const orders = await Database.all(
        "SELECT orders.*,restaurants.name as restaurant_name,restaurants.logo as restaurant_logo FROM orders inner join restaurants ON(orders.res_id=restaurants.id) WHERE orders.user_id = ? ORDER BY orders.id DESC LIMIT ?",
        [userId, limit]
      );
      const orderIds = orders.map((row) => row.id).join(",");
      const orderDetails = await Database.all(
        "SELECT order_product_details.*,products.name,products.image FROM order_product_details inner join products ON(order_product_details.product_id=products.id) WHERE order_id IN(" +
          orderIds +
          ")"
      );
      const orderDetailsJson = {};
      orderDetails.forEach((orderDetail) => {
        if (orderDetailsJson[orderDetail.order_id]) {
          orderDetailsJson[orderDetail.order_id].push(orderDetail);
        } else {
          orderDetailsJson[orderDetail.order_id] = [orderDetail];
        }
      });
      const orderAddons = await Database.all(
        "SELECT order_product_addons_details.*,product_addons.name,product_addons.image FROM order_product_addons_details inner join product_addons ON(order_product_addons_details.addon_id=product_addons.id) WHERE order_id IN(" +
          orderIds +
          ")"
      );
      //group addon by product_id
      const result = orders.map((order) => {
        const addonsInOrder = orderAddons.filter(
          (addon) => addon.order_id === order.id
        );
        const productsInOrder = orderDetailsJson[order.id] || [];
        productsInOrder.forEach((product) => {
          product.addons = addonsInOrder.filter(
            (addon) => addon.product_id === product.product_id
          );
        });
        return {
          ...order,
          products: productsInOrder,
        };
      });
      return result;
    } catch (e) {
      console.log({ e });
      throw new Error("Something went wrong");
    }
  },
  getLatestOrderIdByUserId,
};
