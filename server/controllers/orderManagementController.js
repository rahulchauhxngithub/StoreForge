
import mongoose from "mongoose";
import Order from "../models/Order.js";
import Store from "../models/Store.js";
import Product from "../models/Product.js";

export async function getMerchantOrders(req, res) {
  try {
    const store = await Store.findOne({
      owner: req.user._id,
    }).select("_id");

    if (!store) {
      return res.status(404).json({
        success: false,
        message: "You do not have a store yet.",
      });
    }

    const orders = await Order.find({ store: store._id })
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      orders,
    });
  } catch (error) {
    console.error("Get merchant orders error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to retrieve orders.",
    });
  }
}

export async function updateMerchantOrderStatus(req, res) {
  const { orderId } = req.params;
  const { status } = req.body;

  const allowedStatuses = [
    "confirmed",
    "processing",
    "shipped",
    "delivered",
    "cancelled",
  ];

  if (!mongoose.isValidObjectId(orderId)) {
    return res.status(400).json({
      success: false,
      message: "Invalid order ID.",
    });
  }

  if (!allowedStatuses.includes(status)) {
    return res.status(400).json({
      success: false,
      message: "Invalid order status.",
    });
  }

  const session = await mongoose.startSession();

  try {
    const store = await Store.findOne({
      owner: req.user._id,
    })
      .select("_id")
      .session(session);

    if (!store) {
      await session.endSession();

      return res.status(404).json({
        success: false,
        message: "You do not have a store yet.",
      });
    }

    let updatedOrder;

    await session.withTransaction(async () => {
      const order = await Order.findOne({
        _id: orderId,
        store: store._id,
      }).session(session);

      if (!order) {
        const error = new Error("Order not found in your store.");
        error.statusCode = 404;
        throw error;
      }

      if (
        order.status === "cancelled" ||
        order.status === "delivered"
      ) {
        const error = new Error(
          `A ${order.status} order cannot be updated.`
        );
        error.statusCode = 409;
        throw error;
      }

      const validTransitions = {
        pending: ["confirmed", "cancelled"],
        confirmed: ["processing", "cancelled"],
        processing: ["shipped", "cancelled"],
        shipped: ["delivered"],
      };

      if (!validTransitions[order.status]?.includes(status)) {
        const error = new Error(
          `Cannot change an order from ${order.status} to ${status}.`
        );
        error.statusCode = 409;
        throw error;
      }

      // Restore inventory only when cancelling the order.
      if (status === "cancelled") {
        for (const item of order.items) {
          const quantity = Number(item.quantity);
          const productId = item.product;

          if (
            !productId ||
            !Number.isInteger(quantity) ||
            quantity < 1
          ) {
            throw new Error(
              "Order contains invalid product or quantity information."
            );
          }

          const result = await Product.updateOne(
            {
              _id: productId,
              store: store._id,
            },
            {
              $inc: { stock: quantity },
            },
            { session }
          );

          if (result.matchedCount !== 1) {
            throw new Error(
              `Could not restore inventory for product ${productId}.`
            );
          }
        }
      }

      order.status = status;
      await order.save({ session });

      updatedOrder = {
        _id: order._id,
        orderNumber: order.orderNumber,
        status: order.status,
      };
    });

    return res.status(200).json({
      success: true,
      message:
        status === "cancelled"
          ? "Order cancelled and inventory restored successfully."
          : "Order status updated successfully.",
      order: updatedOrder,
    });
  } catch (error) {
    console.error("Update order status error:", error.message);

    return res.status(error.statusCode || 500).json({
      success: false,
      message:
        error.statusCode
          ? error.message
          : "Unable to update order status.",
    });
  } finally {
    await session.endSession();
  }
}
