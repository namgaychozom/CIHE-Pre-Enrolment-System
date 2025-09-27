import express from "express";
import AuthController  from "../controllers/auth.controller.js";
import { authMiddleware } from "../middleware/auth.js";


const router = express.Router();

// Public
router.post("/register", AuthController.register);
router.post("/login", AuthController.login);
router.post("/refresh", AuthController.refresh);
router.post("/forgot-password", AuthController.requestPasswordReset);
router.post("/reset-password", AuthController.resetPassword);

// Protected
router.post("/logout", authMiddleware, AuthController.logout);
router.post("/change-password", authMiddleware, AuthController.changePassword);
router.get("/profile", authMiddleware, AuthController.profile);
router.put("/profile", authMiddleware, AuthController.updateProfile);

export default router;
