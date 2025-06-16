import mongoose, { Document, Schema } from "mongoose";

export interface IUser extends Document {
  name: string;
  email: string;
  password?: string; // Optional for OAuth users
  avatar?: string;
  bio?: string;
  state?: string;
  lga?: string;
  ppa?: string;
  batch?: string;
  socialLinks?: {
    twitter?: string;
    linkedin?: string;
    instagram?: string;
  };
  isAdmin: boolean;
  isVerified: boolean;
  googleId?: string;
  resetPasswordToken?: string;
  resetPasswordExpires?: Date;
}

const userSchema = new Schema<IUser>(
  {
    name: { type: String },
    email: { type: String, required: true, unique: true },
    password: { type: String }, // Not required for Google OAuth users
    avatar: { type: String },
    bio: { type: String },
    state: { type: String },
    lga: { type: String },
    ppa: { type: String },
    batch: { type: String },
    socialLinks: {
      twitter: { type: String },
      linkedin: { type: String },
      instagram: { type: String },
    },
    isAdmin: { type: Boolean, default: false },
    isVerified: { type: Boolean, default: false },
    googleId: { type: String },
    resetPasswordToken: { type: String },
    resetPasswordExpires: { type: Date },
  },
  { timestamps: true }
);

export default mongoose.model<IUser>("User", userSchema);
