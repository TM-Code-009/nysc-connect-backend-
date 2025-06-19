import { Request, Response } from "express";
import User from "../models/User";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import sendEmail, { generateVerificationEmail } from "../utils/email";

export const registerUser = async (req: Request, res: Response): Promise<void> => {
    try {
      const { email, password } = req.body;
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
  
      // 📩 Send email
      const { subject, text, html } = generateVerificationEmail(email, verificationLink);
      await sendEmail(email, subject, text, html);
  
      res.status(201).json({ message: "User registered. Please check your email to verify your account.",token });
    } catch (error: any) {
      console.error("Error during registration:", error);
      res.status(500).json({ message: "Server error" });
    }
  };
  

  export const loginUser = async (req: Request, res: Response): Promise<void> => {
    try {
      const { email, password } = req.body;
      const user: any = await User.findOne({ email });
  
      if (!user || !(await bcrypt.compare(password, user.password || ""))) {
        res.status(401).json({ message: "Invalid credentials" });
        return;
      }
  
      // ✅ Check if the user's email is verified
      if (!user.isVerified) {
        res.status(403).json({ message: "Please verify your email before logging in." });
        return;
      }
  
      const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET!, {
        expiresIn: "1d",
      });
      res.json({ token });
    } catch (error: any) {
      console.error("Error during login:", error);
      res.status(500).json({ message: "Server error" });
    }
  };
  


export const verifyEmail = async (req: Request, res: Response) => {
    try {
      const { token } = req.params;
      const decoded: any = jwt.verify(token, process.env.JWT_SECRET!);
      
      const user = await User.findById(decoded.id);
      if (!user) return res.status(404).json({ message: "User not found" });
  
      user.isVerified = true;
      await user.save();
  
      res.status(200).json({ message: "Email verified successfully. You can now login." });
    } catch (error) {
      res.status(400).json({ message: "Invalid or expired token" });
    }
  };


  export const forgotPassword = async (req: Request, res: Response): Promise<void> => {
    try {
      const { email } = req.body;
  
      const user: any = await User.findOne({ email });
      if (!user) {
        res.status(404).json({ message: "User not found" });
        return;
      }
  
      // Generate reset token valid for 1 hour
      const resetToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET!, {
        expiresIn: "1h",
      });
  
      // Save token and expiration to user document
      user.resetPasswordToken = resetToken;
      user.resetPasswordExpires = new Date(Date.now() + 3600000); // 1 hour
      await user.save();
  
      const resetLink = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;
  
      const subject = "🔐 Reset your password";
      const text = `A password change was requested. If this was you, use the link below to reset your password: ${resetLink}`;
  
      const html = `
        <div style="background-color:#000; color:#fff; padding:30px; font-family: Arial, sans-serif; border-radius: 10px;  margin: auto;">
  
          <h1 style="font-size: 24px; font-weight: bold; margin-bottom: 20px;">Reset password</h1>
  
          <p style="margin-bottom: 20px;">A password change has been requested for your account. If this was you, please use the link below to reset your password.</p>
  
          <a href="${resetLink}" style="background-color:#00e676; color:#000; padding: 12px 20px; text-decoration: none; font-weight: bold; display:inline-block; border-radius:6px;">Reset password</a>
  
          <p style="margin-top: 30px; color: #bbb;">This link will expire after 1 hour. If you did not make this request, you can safely ignore this email.</p>
        </div>
      `;
  
      await sendEmail(user.email, subject, text, html);
  
      res.status(200).json({ message: "Password reset link sent to your email.", resetToken });
    } catch (error) {
      console.error("Forgot password error:", error);
      res.status(500).json({ message: "Server error" });
    }
  };
  
  

  
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
      resetPasswordExpires: { $gt: Date.now() }, // Check if token is still valid
    });

    if (!user) {
      res.status(400).json({ message: "Invalid or expired token" });
      return;
    }

    // Hash and set the new password
    const hashedPassword = await bcrypt.hash(password, 10);
    user.password = hashedPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;

    await user.save();

    res.status(200).json({ message: "Password has been reset successfully." });
  } catch (error) {
    console.error("Reset password error:", error);
    res.status(500).json({ message: "Server error" });
  }
};


