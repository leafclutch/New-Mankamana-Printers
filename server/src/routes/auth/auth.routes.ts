import { Router } from "express";
import * as authController from "../../controller/auth/auth.controller";
import { protect } from "../../middleware/auth.middleware";

const router = Router();

// Login endpoint for clients/admins to get an access token
router.post("/login", authController.loginClient);
// Logout endpoint to clear the session context
router.post("/logout", authController.logout);
// Fetch profile information for the currently logged-in user
router.get("/me", protect, authController.getMe);

export default router;