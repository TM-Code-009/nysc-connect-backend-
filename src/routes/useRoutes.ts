import express from "express";
import { getProfile, updateProfile } from "../controllers/userController";
import { protect } from "../middlewares/authMiddleware";
import { asyncHandler } from "../utils/asynuHandler"; // ✅ fixed typo

const router = express.Router();

router.get("/profile", protect, asyncHandler(getProfile));
router.put("/profile", protect, asyncHandler(updateProfile));

export default router;
