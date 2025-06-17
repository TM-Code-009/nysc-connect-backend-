import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import connectDB from "./utils/db";
import authRoutes from "./routes/authRoutes";
import passport from "passport";
import session from "express-session";
import "./config/passport";

dotenv.config();
const app = express();

app.use(cors());
app.use(express.json());

connectDB();

app.use("/api/auth", authRoutes);
app.use(passport.initialize());
app.use(passport.session());

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
