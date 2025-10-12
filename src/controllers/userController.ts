import { Request, Response } from "express";
import User, { IUser } from "../models/User";

// Get Profile
export const getProfile = async (req: Request, res: Response) => {
  const user = await User.findById((req.user as IUser)._id).select("-password");
  if (!user) return res.status(404).json({ message: "User not found" });
  res.status(200).json(user);
};

export const updateProfile = async (req: Request, res: Response) => {
  try {
    const userId = (req.user as IUser)._id;
    const updates = req.body;

    // Deep merge for nested fields like socialLinks
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    // Manually assign fields
    user.name = updates.name ?? user.name;
    user.bio = updates.bio ?? user.bio;
    user.state = updates.state ?? user.state;
    user.lga = updates.lga ?? user.lga;
    user.ppa = updates.ppa ?? user.ppa;
    user.batch = updates.batch ?? user.batch;
    user.avatar = updates.avatar ?? user.avatar;

    if (updates.socialLinks) {
      user.socialLinks = {
        ...user.socialLinks,
        ...updates.socialLinks,
      };
    }

    await user.save();
    res.status(200).json(user);
  } catch (error) {
    console.error("Update error:", error);
    res.status(500).json({ message: "Server error" });
  }
};
