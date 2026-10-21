
import mongoose from "mongoose";
import Order from "../models/Order.js";
import Store from "../models/Store.js";
import Product from "../models/Product.js";

export async function createOrder(req, res) {
  const { slug } = req.params;
  const { items, customer, shippingAddress } = req.body;

  // Validate the customer information.
  if (
    !customer ||
    typeof customer.name !== "string" ||
    typeof customer.email !== "string" ||
    !customer.name.trim() ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customer.email.trim()) ||
    !shippingAddress ||
    typeof shippingAddress.addressLine !== "string" ||
    typeof shippingAddress.city !== "string" ||
    typeof shippingAddress.state !== "string" ||
    typeof shippingAddress.postalCode !== "string" ||
    !shippingAddress.addressLine.trim() ||
    !shippingAddress.city.trim() ||
    !shippingAddress.state.trim() ||
    !shippingAddress.postalCode.trim()
  ) {
    return res.status(400).json({
      success: false,
      message: "Valid customer and shipping details are required.",
    });
  }

  if (
    customer.name.trim().length > 100 ||
    customer.email.trim().length > 254 ||
    (customer.phone && (
      typeof customer.phone !== "string" ||
      customer.phone.length > 20
    )) ||
    shippingAddress.addressLine.trim().length > 200 ||
    shippingAddress.city.trim().length > 100 ||
    shippingAddress.state.trim().length > 100 ||
    shippingAddress.postalCode.trim().length > 20 ||
    (shippingAddress.country &&
      (typeof shippingAddress.country !== "string" ||
        shippingAddress.country.trim().length > 100))
  ) {
    return res.status(400).json({
      success: false,
      message: "One or more customer or address fields are too long.",
    });
  }

  // Validate the requested products.
  if (
    !Array.isArray(items) ||
    items.length === 0 ||
    items.length > 50
  ) {
    return res.status(400).json({
      success: false,
      message: "Your cart must contain between 1 and 50 items.",
    });
  }

  const quantities = new Map();

  for (const item of items) {
    if (
      !item ||
      typeof item.productId !== "string" ||
      !mongoose.isValidObjectId(item.productId) ||
      !Number.isSafeInteger(item.quantity) ||
      item.quantity < 1
    ) {
      return res.status(400).json({
        success: false,
        message: "Each item must have a valid product ID and quantity.",
      });
    }

    const productId = item.productId;

    quantities.set(
      productId,
      (quantities.get(productId) || 0) + item.quantity
    );

    if (!Number.isSafeInteger(quantities.get(productId))) {
      return res.status(400).json({
        success: false,
        message: "Requested quantity is too large.",
      });
    }
  }

  let session;

  try {
    // Find the active public store.
    const store = await Store.findOne({
      slug: slug.toLowerCase(),
      isActive: true,
    });

    if (!store) {
      return res.status(404).json({
        success: false,
        message: "Store not found or unavailable.",
      });
    }

    session = await mongoose.startSession();

    let createdOrder;

    // Order creation and inventory changes must succeed together.
    await session.withTransaction(async () => {
      const orderItems = [];
      let subtotal = 0;

      for (const [productId, quantity] of quantities) {
        // Only accept active products belonging to this store.
        const product = await Product.findOne({
          _id: productId,
          store: store._id,
          isActive: true,
        }).session(session);

        if (!product) {
          throw new Error("PRODUCT_NOT_AVAILABLE");
        }

        if (product.stock < quantity) {
          throw new Error(`INSUFFICIENT_STOCK:${product.name}`);
        }

        // Atomically decrement stock only when enough remains.
        const updatedProduct = await Product.findOneAndUpdate(
          {
            _id: product._id,
            store: store._id,
            isActive: true,
            stock: { $gte: quantity },
          },
          {
            $inc: { stock: -quantity },
          },
          {
            new: true,
            session,
          }
        );

        if (!updatedProduct) {
          throw new Error(`INSUFFICIENT_STOCK:${product.name}`);
        }

        // Use the database price, never a price from the browser.
        const lineTotal = product.price * quantity;

        if (!Number.isFinite(lineTotal)) {
          throw new Error("INVALID_ORDER_TOTAL");
        }

        subtotal += lineTotal;

        if (!Number.isFinite(subtotal)) {
          throw new Error("INVALID_ORDER_TOTAL");
        }

        orderItems.push({
          product: product._id,
          name: product.name,
          price: product.price,
          quantity,
        });
      }

      // Create a human-readable reference for the customer.
      const orderNumber = `SF-${new mongoose.Types.ObjectId()
        .toString()
        .toUpperCase()}`;

      const orders = await Order.create(
        [
          {
            orderNumber,
            store: store._id,
            items: orderItems,
            customer: {
              name: customer.name.trim(),
              email: customer.email.trim().toLowerCase(),
              phone: customer.phone?.trim() || "",
            },
            shippingAddress: {
              addressLine: shippingAddress.addressLine.trim(),
              city: shippingAddress.city.trim(),
              state: shippingAddress.state.trim(),
              postalCode: shippingAddress.postalCode.trim(),
              country: shippingAddress.country?.trim() || "India",
            },
            subtotal,
            status: "pending",
            paymentStatus: "pending",
            paymentMethod: "cash_on_delivery",
          },
        ],
        { session }
      );

      createdOrder = orders[0];
    });

    return res.status(201).json({
      success: true,
      message: "Order placed successfully.",
      order: {
        orderNumber: createdOrder.orderNumber,
        items: createdOrder.items,
        subtotal: createdOrder.subtotal,
        status: createdOrder.status,
        paymentStatus: createdOrder.paymentStatus,
        paymentMethod: createdOrder.paymentMethod,
        createdAt: createdOrder.createdAt,
      },
    });
  } catch (error) {
    if (error.message === "PRODUCT_NOT_AVAILABLE") {
      return res.status(400).json({
        success: false,
        message: "A product is no longer available in this store.",
      });
    }

    if (error.message.startsWith("INSUFFICIENT_STOCK:")) {
      const productName = error.message.split(":")[1];

      return res.status(409).json({
        success: false,
        message: `Insufficient stock for ${productName}. Please update your cart.`,
      });
    }

    if (error.message === "INVALID_ORDER_TOTAL") {
      return res.status(400).json({
        success: false,
        message: "Unable to calculate a valid order total.",
      });
    }

    console.error("Create order error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to place your order. Please try again.",
    });
  } finally {
    if (session) {
      await session.endSession();
    }
  }
}
