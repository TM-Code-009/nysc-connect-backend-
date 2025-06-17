import jwt from "jsonwebtoken";
import passport from "passport";
import express from "express";
import { registerUser, loginUser, verifyEmail, forgotPassword, resetPassword } from "../controllers/authController";

const router = express.Router();

router.post("/register", registerUser as express.RequestHandler);
router.post("/login", loginUser as express.RequestHandler);
router.get("/verify-email/:token", verifyEmail as express.RequestHandler);
router.post("/forgot-password", forgotPassword as express.RequestHandler);
router.post("/reset-password/:token", resetPassword as express.RequestHandler);





router.get("/google", passport.authenticate("google", { scope: ["profile", "email"] }));

router.get(
  "/google/callback",
  passport.authenticate("google", { session: false, failureRedirect: "/login" }),
  (req, res) => {
    const user: any = req.user;
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET!, { expiresIn: "1d" });

    // Redirect to frontend with token (or set cookie)
    res.redirect(`${process.env.FRONTEND_URL}/google-success?token=${token}`);
  }
);





export default router;
