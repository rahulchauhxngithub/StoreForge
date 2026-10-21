
import Order from "../models/Order.js";
import Store from "../models/Store.js";
import Product from "../models/Product.js";

export async function getMerchantAnalytics(req, res) {
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

    const storeId = store._id;

    const [
      totalOrders,
      pendingOrders,
      deliveredOrders,
      revenueResult,
      lowStockProducts,
      recentOrders,
    ] = await Promise.all([
      Order.countDocuments({ store: storeId }),

      Order.countDocuments({
        store: storeId,
        status: "pending",
      }),

      Order.countDocuments({
        store: storeId,
        status: "delivered",
      }),

      Order.aggregate([
        {
          $match: {
            store: storeId,
            status: "delivered",
          },
        },
        {
          $group: {
            _id: null,
            total: { $sum: "$subtotal" },
          },
        },
      ]),

      Product.find({
        store: storeId,
        isActive: true,
        stock: { $lte: 5 },
      })
        .select("name stock price")
        .sort({ stock: 1 })
        .limit(10)
        .lean(),

      Order.find({ store: storeId })
        .select("orderNumber customer subtotal status createdAt")
        .sort({ createdAt: -1 })
        .limit(5)
        .lean(),
    ]);

    const totalRevenue = revenueResult[0]?.total || 0;

    return res.status(200).json({
      success: true,
      analytics: {
        totalOrders,
        pendingOrders,
        deliveredOrders,
        totalRevenue,
        lowStockProducts,
        recentOrders,
      },
    });
  } catch (error) {
    console.error("Get merchant analytics error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to retrieve merchant analytics.",
    });
  }
}
