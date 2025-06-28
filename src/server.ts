import express from "express";
import dotenv from "dotenv";
import authRoutes from "./routes/authRoutes";
import userRoutes from "./routes/useRoutes";
import cors from "cors";
import connectDB from "./utils/db";
import passport from "passport";
import "./config/passport";
import session from "express-session";
import MongoStore from "connect-mongo";

dotenv.config();
const app = express();

app.use(cors({ origin: "https://green-linkio.web.app", credentials: true }));

app.use(express.json());

connectDB();

app.use("/api/auth", authRoutes);
app.use("/api/user", userRoutes);
app.use(session({
  secret: process.env.SESSION_SECRET || "your_fallback_secret",
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: process.env.MONGO_URI!, // your MongoDB connection string
    collectionName: "sessions",
  }),
  cookie: {
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    maxAge: 1000 * 60 * 60 * 24, // 1 day
  },
}));
app.use(passport.initialize());
app.use(passport.session());

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
