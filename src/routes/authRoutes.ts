import express from "express";
import { registerUser, loginUser, verifyEmail, forgotPassword, resetPassword } from "../controllers/authController";

const router = express.Router();

router.post("/register", registerUser as express.RequestHandler);
router.post("/login", loginUser as express.RequestHandler);
router.get("/verify-email/:token", verifyEmail as express.RequestHandler);
router.post("/forgot-password", forgotPassword as express.RequestHandler);
router.post("/reset-password/:token", resetPassword as express.RequestHandler);

export default router;
