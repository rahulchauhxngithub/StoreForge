
import express from "express";
import {
  createStore,
  getMyStore,
} from "../controllers/storeController.js";
import { getPublicStore } from "../controllers/publicStoreController.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

// Public route: visitors do not need to log in.
router.get("/public/:slug", getPublicStore);

// All routes below this point require authentication.
router.use(authMiddleware);

router.post("/", createStore);
router.get("/mine", getMyStore);

export default router;
