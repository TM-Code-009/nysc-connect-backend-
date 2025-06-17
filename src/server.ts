import express from "express";
import dotenv from "dotenv";
import authRoutes from "./routes/authRoutes";
import cors from "cors";
import connectDB from "./utils/db";
import passport from "passport";
import "./config/passport";
import session from "express-session";

dotenv.config();
const app = express();

app.use(cors());
app.use(express.json());

connectDB();

app.use("/api/auth", authRoutes);
app.use(session({
  secret: process.env.SESSION_SECRET || "your_fallback_secret",
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === "production", // true on Render
    httpOnly: true,
    maxAge: 1000 * 60 * 60 * 24, // 1 day
  },
}));
app.use(passport.initialize());
app.use(passport.session());

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
