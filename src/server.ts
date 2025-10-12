import express from "express";
import dotenv from "dotenv";
import authRoutes from "./routes/authRoutes";
import userRoutes from "./routes/useRoutes"; // ✅ fixed the typo here
import cors from "cors";
import connectDB from "./utils/db";
import passport from "passport";
import "./config/passport";
import session from "express-session";
import MongoStore from "connect-mongo";

dotenv.config();
const app = express();

// ✅ Middleware
app.use(
  cors({
    origin: ["http://localhost:5173", "https://green-linkio.web.app"],
    credentials: true,
  })
);

app.use(express.json());

// ✅ Connect MongoDB
connectDB();

// ✅ Sessions (must come before passport.session)
app.use(
  session({
    secret: process.env.SESSION_SECRET || "your_fallback_secret",
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl: process.env.MONGO_URI!,
      collectionName: "sessions",
    }),
    cookie: {
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24, // 1 day
    },
  })
);

// ✅ Passport initialization
app.use(passport.initialize());
app.use(passport.session());

// ✅ Routes
app.use("/api/auth", authRoutes);
app.use("/api/user", userRoutes); // ✅ corrected import and route mount

// ✅ Optional root route
app.get("/", (req, res) => {
  res.send("✅ NYSC Connect Backend is running successfully!");
});

// ✅ 404 handler
app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
