import express from "express";
import { updateProfile } from "../controllers/userController";
import { protect } from "../middlewares/authMiddleware";
import { asyncHandler } from "../utils/asynuHandler";

const router = express.Router();

router.put("/profile", asyncHandler(updateProfile));

export default router;
