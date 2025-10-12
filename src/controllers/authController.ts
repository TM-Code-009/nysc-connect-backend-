import { Request, Response } from "express";
import User, { IUser } from "../models/User";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import sendEmail, { generateVerificationEmail } from "../utils/email";

// ✅ REGISTER USER
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
    const user = await User.create({ email, password: hashedPassword });

    // 🔐 Create email verification token
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET!, { expiresIn: "3h" });
    const verificationLink = `${process.env.FRONTEND_URL}/verify/${token}`;

    // 📩 Send verification email
    const { subject, text, html } = generateVerificationEmail(email, verificationLink);
    await sendEmail(email, subject, text, html);

    res.status(201).json({
      message: "User registered successfully. Please check your email to verify your account.",
      token,
    });
  } catch (error) {
    console.error("Error during registration:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// ✅ LOGIN USER
export const loginUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    const user: IUser | null = await User.findOne({ email });
    if (!user || !(await bcrypt.compare(password, user.password || ""))) {
      res.status(401).json({ message: "Invalid email or password" });
      return;
    }

    // 🚫 Check if email is verified
    if (!user.isVerified) {
      res.status(403).json({ message: "Please verify your email before logging in." });
      return;
    }

    // ✅ Create JWT for session
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET!, { expiresIn: "1d" });
    res.status(200).json({
      message: "Login successful",
      token,
      user: {
        _id: user._id,
        email: user.email,
        name: user.name,
        avatar: user.avatar,
      },
    });
  } catch (error) {
    console.error("Error during login:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// ✅ VERIFY EMAIL
export const verifyEmail = async (req: Request, res: Response): Promise<void> => {
  try {
    const { token } = req.params;
    const decoded: any = jwt.verify(token, process.env.JWT_SECRET!);

    const user = await User.findById(decoded.id);
    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    user.isVerified = true;
    await user.save();

    res.status(200).json({ message: "Email verified successfully. You can now log in." });
  } catch (error) {
    console.error("Email verification error:", error);
    res.status(400).json({ message: "Invalid or expired verification link" });
  }
};

// ✅ FORGOT PASSWORD
export const forgotPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email } = req.body;

    const user: IUser | null = await User.findOne({ email });
    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    // Generate reset token valid for 1 hour
    const resetToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET!, { expiresIn: "1h" });

    // Save token & expiry
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = new Date(Date.now() + 3600000); // 1 hour
    await user.save();

    const resetLink = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;

    const subject = "🔐 Reset your password";
    const text = `A password change was requested. Use this link to reset your password: ${resetLink}`;
    const html = `
      <div style="background-color:#000; color:#fff; padding:30px; font-family: Arial, sans-serif; border-radius: 10px;">
        <h1 style="font-size: 24px;">Reset Password</h1>
        <p>If you requested a password reset, click below:</p>
        <a href="${resetLink}" style="background-color:#00e676; color:#000; padding:12px 20px; border-radius:6px; text-decoration:none;">Reset Password</a>
        <p style="color:#bbb; margin-top:20px;">This link expires in 1 hour. If you didn’t request this, ignore this email.</p>
      </div>
    `;

    await sendEmail(user.email, subject, text, html);

    res.status(200).json({ message: "Password reset link sent to your email." });
  } catch (error) {
    console.error("Forgot password error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// ✅ RESET PASSWORD
export const resetPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    if (!token || !password) {
      res.status(400).json({ message: "Token and new password are required" });
      return;
    }

    // Verify token
    let decoded: any;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET!);
    } catch (err) {
      res.status(400).json({ message: "Invalid or expired token" });
      return;
    }

    const user = await User.findOne({
      _id: decoded.id,
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      res.status(400).json({ message: "Invalid or expired token" });
      return;
    }

    // Hash & set new password
    const hashedPassword = await bcrypt.hash(password, 10);
    user.password = hashedPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.status(200).json({ message: "Password reset successfully. You can now log in." });
  } catch (error) {
    console.error("Reset password error:", error);
    res.status(500).json({ message: "Server error" });
  }
};
