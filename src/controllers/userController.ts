import { Request, Response } from "express";
import User, { IUser } from "../models/User";

// Get Profile
export const getProfile = async (req: Request, res: Response) => {
  const user = await User.findById((req.user as IUser)._id).select("-password");
  if (!user) return res.status(404).json({ message: "User not found" });
  res.status(200).json(user);
};

// Update Profile
export const updateProfile = async (req: Request, res: Response) => {
  const userId = (req.user as IUser)._id;
  const updates = req.body;

  const user = await User.findByIdAndUpdate(
    userId,
    { $set: updates },
    { new: true }
  ).select("-password");

  if (!user) return res.status(404).json({ message: "User not found" });
  res.status(200).json(user);
};
