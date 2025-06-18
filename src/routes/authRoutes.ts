import jwt from "jsonwebtoken";
import passport from "passport";
import express from "express";
import { registerUser, loginUser, verifyEmail, forgotPassword, resetPassword } from "../controllers/authController";
import User from "../models/User";
import sendEmail from "../utils/email";

const router = express.Router();

router.post("/register", registerUser as express.RequestHandler);
router.post("/login", loginUser as express.RequestHandler);
router.get("/verify-email/:token", verifyEmail as express.RequestHandler);
router.post("/forgot-password", forgotPassword as express.RequestHandler);
router.post("/reset-password/:token", resetPassword as express.RequestHandler);
router.get("/check-verification-status", async (req, res) => {
  const { email } = req.query;
  const user = await User.findOne({ email });
  res.json({ verified: user?.isVerified });
});

router.post("/resend-verification", async (req, res): Promise<void> => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user){
      return
    }
    if (user.isVerified) { res.status(400).json({ message: "User already verified" });
    return
}
    // Generate token
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET!, {
      expiresIn: "1h",
    });

    // Create verification link
    const verificationLink = `${process.env.FRONTEND_URL}/verify-email/${token}`;

    // Send email
    const subject = "🔐 Verify Your Email Again";
    const text = `Click here to verify your email: ${verificationLink}`;
    const html = `
      <div style="font-family: Arial, sans-serif; padding: 20px;">
        <h2>🔐 Verify Your Email</h2>
        <p>Hi ${user.name || "there"},</p>
        <p>Please click the button below to verify your email:</p>
        <a href="${verificationLink}" style="display:inline-block;margin-top:10px;padding:10px 20px;background:#28a745;color:#fff;text-decoration:none;border-radius:5px;">Verify Email</a>
        <p style="margin-top: 20px;">If you did not sign up, please ignore this email.</p>
      </div>
    `;

    await sendEmail(user.email, subject, text, html);

    res.status(200).json({ message: "Verification email resent." });
  } catch (err) {
    console.error("Resend email error:", err);
    res.status(500).json({ message: "Server error" });
  }
});




router.get("/google", passport.authenticate("google", { scope: ["profile", "email"] }));

router.get(
  "/google/callback",
  passport.authenticate("google", { session: false, failureRedirect: "/login" }),
  (req, res) => {
    const user: any = req.user;
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET!, { expiresIn: "1d" });

    // Redirect to frontend with token (or set cookie)
    res.redirect(`${process.env.FRONTEND_URL}/google-success?token=${token}`);
  }
);





export default router;
