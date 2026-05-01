import express from "express";
import cors from "cors";
import session from "express-session";
import MongoStore from "connect-mongo";

// Database
import connectDB from "./utils/db";

// Routes
import authRoutes from "./routes/authRoutes";
import userRoutes from "./routes/useRoutes";

// Auth
import passport from "passport";
import "./config/passport";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";


const app = express();

/* =========================
CORS CONFIG
========================= */
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "https://green-linkio.web.app",
      "https://nysc-connect-frontend.onrender.com",
    ],
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);



/* =========================
BODY PARSER
========================= */
app.use(express.json());

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: "Too many requests, try again later.",
});

app.use(limiter);

/* =========================
DATABASE
========================= */
connectDB();

app.use(cookieParser());
/* =========================
   SESSION CONFIG
========================= */
app.use(
  session({
    secret: process.env.SESSION_SECRET || "fallback_secret",
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl: process.env.MONGO_URI as string,
      collectionName: "sessions",
    }),
    cookie: {
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24,
    },
  })
);

/* =========================
   PASSPORT INIT
========================= */
app.use(passport.initialize());
app.use(passport.session());

/* =========================
   ROUTES
========================= */
app.use("/api/auth", authRoutes);
app.use("/api/user", userRoutes);

/* =========================
   HEALTH CHECK
========================= */
app.get("/", (req, res) => {
  res.send("✅ NYSC Connect Backend is running successfully!");
});

/* =========================
   404 HANDLER
========================= */
app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

/* =========================
   START SERVER
========================= */
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log("GOOGLE CLIENT ID:", process.env.GOOGLE_CLIENT_ID);
  console.log(`🚀 Server running on port ${PORT}`);
});