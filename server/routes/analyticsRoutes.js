
import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import { getMerchantAnalytics } from "../controllers/analyticsController.js";

const router = express.Router();

// Only authenticated merchants can access analytics.
router.use(authMiddleware);

router.get("/", getMerchantAnalytics);

export default router;
