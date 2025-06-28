import jwt from "jsonwebtoken";
import User, { IUser } from "../models/User";
import { Request, Response, NextFunction } from "express";

export const protect = async (req: Request, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ message: "Not authorized" });

  try {
    const decoded: any = jwt.verify(token, process.env.JWT_SECRET!);
    const user = await User.findById(decoded.id).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    req.user = user as IUser; // ✅ cast to your custom IUser interface

    next();
  } catch (error) {
    res.status(401).json({ message: "Invalid token" });
  }
};
