import rateLimit from "express-rate-limit";
import jwt from "jsonwebtoken";
import passport from "passport";
import express, { Request, Response, RequestHandler } from "express";

import {
  registerUser,
  loginUser,
  verifyEmail,
  forgotPassword,
  resetPassword,
} from "../controllers/authController";

import User from "../models/User";
import  {sendEmail, generateVerificationEmail } from "../utils/email";
import { generateAccessToken } from "../utils/token"; // ✅ FIXED PATH

const router = express.Router();

/* ======================
   RATE LIMITER
====================== */
const authLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 10,
  message: "Too many login attempts. Try again later.",
});

/* ======================
   AUTH ROUTES
====================== */
router.post("/login", authLimiter, loginUser);
router.post("/register", authLimiter, registerUser);
router.post("/forgot-password", authLimiter, forgotPassword);
router.get("/verify-email/:token", verifyEmail);
router.post("/reset-password/:token", resetPassword);

/* ======================
   CHECK VERIFICATION
====================== */
router.get("/check-verification-status", async (req: Request, res: Response) => {
  try {
    const email = req.query.email as string;

    if (!email) {
      res.status(400).json({ message: "Email is required" });
      return;
    }

    const user = await User.findOne({ email });

    res.json({ verified: user?.isVerified ?? false });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

/* ======================
   RESEND VERIFICATION
====================== */
router.post("/resend-verification", async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    if (user.isVerified) {
      res.status(400).json({ message: "User already verified" });
      return;
    }

    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET!,
      { expiresIn: "1h" }
    );

    const verificationLink = `${process.env.FRONTEND_URL}/verify/${token}`;

    const { subject, text, html } = generateVerificationEmail(
      user.name || "there",
      verificationLink
    );

    await sendEmail(user.email, subject, text, html);

    res.json({ message: "Verification email resent successfully" });
  } catch (err) {
    console.error("Resend email error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

/* ======================
   GOOGLE AUTH
====================== */
router.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

router.get(
  "/google/callback",
  passport.authenticate("google", {
    session: false,
    failureRedirect: "/login",
  }),
  (req: Request, res: Response) => {
    const user: any = req.user;

    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET!,
      { expiresIn: "1d" }
    );

    res.redirect(
      `${process.env.FRONTEND_URL}/google-success?token=${token}`
    );
  }
);

/* ======================
   REFRESH TOKEN
====================== */
router.post("/refresh-token", async (req: Request, res: Response) => {
  try {
    const token = req.cookies?.refreshToken;

    if (!token) {
      res.status(401).json({ message: "No refresh token" });
      return;
    }

    const decoded: any = jwt.verify(
      token,
      process.env.JWT_REFRESH_SECRET!
    );

    const user = await User.findById(decoded.id);

    if (!user || user.refreshToken !== token) {
      res.status(403).json({ message: "Invalid refresh token" });
      return;
    }

    const newAccessToken = generateAccessToken(user._id.toString());

    res.json({ accessToken: newAccessToken });
  } catch (err) {
    res.status(403).json({ message: "Token expired or invalid" });
  }
});

export default router;