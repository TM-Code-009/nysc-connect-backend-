import express from "express";
import { getProfile, updateProfile } from "../controllers/userController";
import { protect } from "../middlewares/authMiddleware"
import { asyncHandler } from "../utils/asynuHandler";

const router = express.Router();

// Get user profile
router.get("/profile", protect, asyncHandler(getProfile));

// Update user profile
router.put("/profile", protect, asyncHandler(updateProfile));

export default router;
