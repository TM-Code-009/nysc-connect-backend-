import passport from "passport";
import express from "express";
import { registerUser, loginUser, verifyEmail, forgotPassword, resetPassword } from "../controllers/authController";

const router = express.Router();

router.post("/register", registerUser as express.RequestHandler);
router.post("/login", loginUser as express.RequestHandler);
router.get("/verify-email/:token", verifyEmail as express.RequestHandler);
router.post("/forgot-password", forgotPassword as express.RequestHandler);
router.post("/reset-password/:token", resetPassword as express.RequestHandler);


router.get("/google", passport.authenticate("google", {
  scope: ["profile", "email"]
}));

router.get("/google/callback",
  passport.authenticate("google", {
    failureRedirect: "/login",
    session: false
  }),
  (req, res) => {
    // You can generate your own JWT here if needed
    res.redirect(`${process.env.FRONTEND_URL}/dashboard`);
  }
);



export default router;
