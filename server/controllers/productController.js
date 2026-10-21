
import mongoose from "mongoose";
import Product from "../models/Product.js";
import Store from "../models/Store.js";

// Create a product for the logged-in merchant's store
export const createProduct = async (req, res) => {
  try {
    const { name, description, price, stock, imageUrl } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ message: "Product name is required" });
    }

    if (
      price === undefined ||
      price === null ||
      price === "" ||
      !Number.isFinite(Number(price)) ||
      Number(price) < 0
    ) {
      return res.status(400).json({ message: "Enter a valid product price" });
    }

    const productStock = stock === undefined || stock === "" ? 0 : Number(stock);

    if (!Number.isInteger(productStock) || productStock < 0) {
      return res.status(400).json({ message: "Stock must be a non-negative whole number" });
    }

    const store = await Store.findOne({ owner: req.user._id });

    if (!store) {
      return res.status(404).json({ message: "Create your store first" });
    }

    const product = await Product.create({
      name: name.trim(),
      description,
      price: Number(price),
      stock: productStock,
      imageUrl,
      store: store._id,
    });

    return res.status(201).json({
      message: "Product created successfully",
      product,
    });
  } catch (error) {
    if (error.name === "ValidationError") {
      return res.status(400).json({ message: error.message });
    }

    console.error("Create product error:", error);
    return res.status(500).json({ message: "Failed to create product" });
  }
};

// Get products belonging to the logged-in merchant
export const getMyProducts = async (req, res) => {
  try {
    const store = await Store.findOne({ owner: req.user._id });

    if (!store) {
      return res.status(404).json({ message: "Store not found" });
    }

    const products = await Product.find({ store: store._id })
      .sort({ createdAt: -1 });

    return res.status(200).json({ products });
  } catch (error) {
    console.error("Get products error:", error);
    return res.status(500).json({ message: "Failed to fetch products" });
  }
};

// Update a product owned by the logged-in merchant
export const updateProduct = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid product ID" });
    }

    const store = await Store.findOne({ owner: req.user._id });

    if (!store) {
      return res.status(404).json({ message: "Store not found" });
    }

    const allowedFields = ["name", "description", "price", "stock", "imageUrl"];
    const updates = {};

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    if (updates.name !== undefined) {
      if (typeof updates.name !== "string" || !updates.name.trim()) {
        return res.status(400).json({ message: "Product name is required" });
      }
      updates.name = updates.name.trim();
    }

    if (updates.price !== undefined) {
      if (
        updates.price === "" ||
        !Number.isFinite(Number(updates.price)) ||
        Number(updates.price) < 0
      ) {
        return res.status(400).json({ message: "Enter a valid product price" });
      }
      updates.price = Number(updates.price);
    }

    if (updates.stock !== undefined) {
      if (
        updates.stock === "" ||
        !Number.isInteger(Number(updates.stock)) ||
        Number(updates.stock) < 0
      ) {
        return res.status(400).json({ message: "Stock must be a non-negative whole number" });
      }
      updates.stock = Number(updates.stock);
    }

    const product = await Product.findOneAndUpdate(
      { _id: req.params.id, store: store._id },
      { $set: updates },
      { returnDocument: "after", runValidators: true }
    );

    if (!product) {
      return res.status(404).json({ message: "Product not found in your store" });
    }

    return res.status(200).json({
      message: "Product updated successfully",
      product,
    });
  } catch (error) {
    if (error.name === "ValidationError" || error.name === "CastError") {
      return res.status(400).json({ message: error.message });
    }

    console.error("Update product error:", error);
    return res.status(500).json({ message: "Failed to update product" });
  }
};

// Delete a product owned by the logged-in merchant
export const deleteProduct = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid product ID" });
    }

    const store = await Store.findOne({ owner: req.user._id });

    if (!store) {
      return res.status(404).json({ message: "Store not found" });
    }

    const product = await Product.findOneAndDelete({
      _id: req.params.id,
      store: store._id,
    });

    if (!product) {
      return res.status(404).json({ message: "Product not found in your store" });
    }

    return res.status(200).json({ message: "Product deleted successfully" });
  } catch (error) {
    console.error("Delete product error:", error);
    return res.status(500).json({ message: "Failed to delete product" });
  }
};
