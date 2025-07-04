import express from "express";
import { updateProfile, getProfile } from "../controllers/userController";
import { protect } from "../middlewares/authMiddleware";
import { asyncHandler } from "../utils/asynuHandler";

const router = express.Router();

// 🔐 Use protect middleware for authenticated routes
router.get("/profile", asyncHandler(getProfile));
router.put("/profile", asyncHandler(updateProfile));

export default router;
