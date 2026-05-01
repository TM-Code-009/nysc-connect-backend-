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

    const user = await User.create({
      email,
      password: hashedPassword,
      isVerified: false,
    });

    // 🔐 Create verification token
    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET!,
      { expiresIn: "3h" }
    );

    const verificationLink = `${process.env.FRONTEND_URL}/verify/${token}`;

    // 📩 FIXED: pass proper name (not email)
    const { subject, text, html } = generateVerificationEmail(
      email.split("@")[0], // clean name
      verificationLink
    );

    console.log("📧 Sending verification email to:", email);

    await sendEmail(email, subject, text, html);

    res.status(201).json({
      message: "User registered successfully. Please check your email to verify your account.",
    });
  } catch (error) {
    console.error("❌ Error during registration:", error);
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

    const resetToken = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET!,
      { expiresIn: "1h" }
    );

    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = new Date(Date.now() + 3600000);
    await user.save();

    const resetLink = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;

    const subject = "🔐 Reset your password";
    const text = `Reset your password: ${resetLink}`;

    const html = `
      <div style="background:#000;color:#fff;padding:30px;font-family:Arial;">
        <h2>Reset Password</h2>
        <p>Click below to reset your password:</p>
        <a href="${resetLink}" style="display:inline-block;padding:12px 20px;background:#00e676;color:#000;border-radius:6px;text-decoration:none;">
          Reset Password
        </a>
        <p style="color:#aaa;margin-top:20px;">Expires in 1 hour</p>
      </div>
    `;

    console.log("📧 Sending reset email to:", email);

    await sendEmail(user.email, subject, text, html);

    console.log("✅ Reset email sent successfully");

    res.status(200).json({
      message: "Password reset link sent to your email.",
    });

  } catch (error) {
    console.error("❌ Forgot password error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// ✅ RESET PASSWORD
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

    console.log("🔐 Password reset successful for:", user.email);

    res.status(200).json({
      message: "Password reset successful",
    });

  } catch (error) {
    console.error("❌ Reset password error:", error);
    res.status(500).json({ message: "Server error" });
  }
};
