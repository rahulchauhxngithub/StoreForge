
import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import {
  getMerchantOrders,
  updateMerchantOrderStatus,
} from "../controllers/orderManagementController.js";

const router = express.Router();

router.use(authMiddleware);

router.get("/", getMerchantOrders);
router.patch("/:orderId/status", updateMerchantOrderStatus);

export default router;
