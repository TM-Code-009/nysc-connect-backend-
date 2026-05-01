import { Request, Response } from "express";
import User, { IUser } from "../models/User";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import {
  generateAccessToken,
  generateRefreshToken
} from "../utils/token";
import { sendEmail, generateVerificationEmail, generateResetPasswordEmail } from "../utils/email";


// =========================
// REGISTER
// =========================
export const registerUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ message: "Email and password are required" });
      return;
    }

    const userExists = await User.findOne({ email });
    if (userExists) {
      res.status(400).json({ message: "User already exists" });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      email,
      password: hashedPassword,
      isVerified: false,
    });

    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET!,
      { expiresIn: "3h" }
    );

    const verificationLink =
      `${process.env.FRONTEND_URL}/verify/${encodeURIComponent(token)}`;

    const { subject, text, html } = generateVerificationEmail(
      email.split("@")[0],
      verificationLink
    );

    console.log("📧 Sending verification email to:", email);

    await sendEmail(email, subject, text, html);

    res.status(201).json({
      message: "User registered successfully. Check email to verify account.",
    });
  } catch (error) {
    console.error("❌ Register error:", error);
    res.status(500).json({ message: "Server error" });
  }
};


// =========================
// LOGIN
// =========================
export const loginUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    const user: IUser | null = await User.findOne({ email });

    if (!user || !(await bcrypt.compare(password, user.password || ""))) {
      res.status(401).json({ message: "Invalid email or password" });
      return;
    }

    if (!user.isVerified) {
      res.status(403).json({ message: "Please verify your email first." });
      return;
    }

    // 🔐 Generate tokens
    const accessToken = generateAccessToken(user._id.toString());
    const refreshToken = generateRefreshToken(user._id.toString());

    // 💾 Store refresh token in DB
    user.refreshToken = refreshToken;
    await user.save();

    // 🍪 Set secure cookie (HTTP ONLY)
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    // 🚀 Send response
    res.status(200).json({
      message: "Login successful",
      accessToken,
      user: {
        _id: user._id,
        email: user.email,
        name: user.name,
        avatar: user.avatar,
        isVerified: user.isVerified,
      },
    });

  } catch (error) {
    console.error("❌ Login error:", error);
    res.status(500).json({ message: "Server error" });
  }
};


// =========================
// VERIFY EMAIL
// =========================
export const verifyEmail = async (req: Request, res: Response): Promise<void> => {
  try {
    const { token } = req.params;

    const decoded: any = jwt.verify(token, process.env.JWT_SECRET!);

    const user = await User.findById(decoded.id);

    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    if (user.isVerified) {
      res.status(200).json({ message: "Email already verified" });
      return;
    }

    user.isVerified = true;
    await user.save();

    res.status(200).json({
      message: "Email verified successfully",
    });

  } catch (error) {
    console.error("❌ Verify error:", error);
    res.status(400).json({ message: "Invalid or expired link" });
  }
};


// =========================
// FORGOT PASSWORD
// =========================
export const forgotPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    const resetToken = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET!,
      { expiresIn: "1h" }
    );

    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = new Date(Date.now() + 3600000);
    await user.save();

    const resetLink =
      `${process.env.FRONTEND_URL}/reset-password/${encodeURIComponent(resetToken)}`;

    const { subject, text, html } =
      generateResetPasswordEmail(user.email, resetLink);

    console.log("📧 Sending reset email:", email);

    await sendEmail(email, subject, text, html);

    res.status(200).json({
      message: "Password reset link sent",
    });

  } catch (error) {
    console.error("❌ Forgot password error:", error);
    res.status(500).json({ message: "Server error" });
  }
};


// =========================
// RESET PASSWORD
// =========================
export const resetPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    if (!token || !password) {
      res.status(400).json({ message: "Token and password required" });
      return;
    }

    let decoded: any;

    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET!);
    } catch {
      res.status(400).json({ message: "Invalid or expired token" });
      return;
    }

    const user = await User.findOne({
      _id: decoded.id,
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: new Date() },
    });

    if (!user) {
      res.status(400).json({ message: "Invalid or expired token" });
      return;
    }

    user.password = await bcrypt.hash(password, 10);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;

    await user.save();

    res.status(200).json({
      message: "Password reset successful",
    });

  } catch (error) {
    console.error("❌ Reset password error:", error);
    res.status(500).json({ message: "Server error" });
  }
};