
import Store from "../models/Store.js";
import Product from "../models/Product.js";

// Retrieve a public store and its active products by slug.
export const getPublicStore = async (req, res) => {
  try {
    const { slug } = req.params;

    const store = await Store.findOne({
      slug: slug.toLowerCase(),
      isActive: true,
    }).select("name slug description createdAt");

    if (!store) {
      return res.status(404).json({
        success: false,
        message: "Store not found.",
      });
    }

    const products = await Product.find({
      store: store._id,
      isActive: true,
    })
      .select("name description price stock imageUrl createdAt")
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      store,
      products,
    });
  } catch (error) {
    console.error("Public store error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to load this store.",
    });
  }
};
