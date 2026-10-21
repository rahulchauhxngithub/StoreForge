
import Store from "../models/Store.js";

export const createStore = async (req, res) => {
  try {
    const { name, description } = req.body;

    // Validate store name.
    if (typeof name !== "string" || name.trim().length < 3) {
      return res.status(400).json({
        success: false,
        message: "Store name must contain at least 3 characters.",
      });
    }

    if (name.trim().length > 100) {
      return res.status(400).json({
        success: false,
        message: "Store name cannot exceed 100 characters.",
      });
    }

    // Validate description, if supplied.
    if (
      description !== undefined &&
      (typeof description !== "string" || description.length > 500)
    ) {
      return res.status(400).json({
        success: false,
        message: "Description must be text of at most 500 characters.",
      });
    }

    // One store per merchant.
    const existingStore = await Store.findOne({
      owner: req.user._id,
    });

    if (existingStore) {
      return res.status(409).json({
        success: false,
        message: "You already have a store.",
        store: existingStore,
      });
    }

    // Generate a URL-friendly slug.
    const baseSlug = name
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 100)
      .replace(/-+$/g, "");

    if (!baseSlug) {
      return res.status(400).json({
        success: false,
        message: "Store name must include letters or numbers.",
      });
    }

    const store = await Store.create({
      name: name.trim(),
      slug: baseSlug,
      description: description?.trim() || "",
      owner: req.user._id,
    });

    return res.status(201).json({
      success: true,
      message: "Store created successfully.",
      store,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "A store with this name or owner already exists.",
      });
    }

    console.error("Create store error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to create your store. Please try again.",
    });
  }
};

export const getMyStore = async (req, res) => {
  try {
    const store = await Store.findOne({
      owner: req.user._id,
    });

    if (!store) {
      return res.status(404).json({
        success: false,
        message: "You haven't created a store yet.",
      });
    }

    return res.status(200).json({
      success: true,
      store,
    });
  } catch (error) {
    console.error("Get store error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to retrieve your store.",
    });
  }
};
