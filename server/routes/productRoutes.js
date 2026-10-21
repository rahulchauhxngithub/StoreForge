
import express from "express";
import {
  createProduct,
  getMyProducts,
  updateProduct,
  deleteProduct,
} from "../controllers/productController.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(authMiddleware);

router.post("/", createProduct);
router.get("/mine", getMyProducts);
router.patch("/:id", updateProduct);
router.delete("/:id", deleteProduct);

export default router;
