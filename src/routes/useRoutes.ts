import express from "express";
import { getProfile, updateProfile } from "../controllers/userController";
import { protect } from "../middlewares/authMiddleware";
import { asyncHandler } from "../utils/asynuHandler";

const router = express.Router();

router

  router.get("/profile", asyncHandler(protect), asyncHandler(getProfile));
  router.put("/profile", asyncHandler(protect), asyncHandler(updateProfile));


export default router;
