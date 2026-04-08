import { Router } from "express";
import * as userController from "../../controller/auth/user.controller";
import { protect, restrictTo } from "../../middleware/auth.middleware";
import { validate } from "../../middleware/validate.middleware";
import { updateProfileSchema } from "../../validators/user.validator";

const router = Router();

// Get the logged-in client's profile details
router.get("/profile", protect, restrictTo("CLIENT"), userController.getProfile);
// Update the logged-in client's profile info (e.g., name, address)
router.patch(
  "/profile",
  protect,
  restrictTo("CLIENT"),
  validate(updateProfileSchema),
  userController.updateProfile
);

export default router;
