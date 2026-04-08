import { Router } from "express";
import { validate } from "../middleware/validate.middleware";
import { createRegistrationRequest } from "../controller/admin.controller";
import { createRegistrationRequestSchema } from "../validators/registration.validators";
import {
  loginUser,
  logoutUser,
  getCurrentUser,
  getProfile,
  updateProfile,
  getTemplateCategories,
  getTemplates,
  getTemplatesByCategory,
  getTemplateById,
  submitDesign,
  getMyDesignSubmissions,
  verifyDesignId,
  getApprovedDesignById
} from "../controller/client.controller";
import { loginSchema } from "../validators/auth.validators";
import { protect, restrictTo } from "../middleware/auth.middleware";

const router = Router();

// Public Routes
router.post("/registerrequest", validate(createRegistrationRequestSchema), createRegistrationRequest);
router.post("/login", validate(loginSchema), loginUser);

// Protected Routes (Requires Authentication and CLIENT role)
router.use(protect);
router.use(restrictTo("CLIENT"));

router.post("/logout", logoutUser);
router.get("/me", getCurrentUser);
router.get("/profile", getProfile);
router.patch("/profile", updateProfile);

router.get("/templates/categories", getTemplateCategories);
router.get("/templates", getTemplates);
router.get("/templates/category/:category", getTemplatesByCategory);
router.get("/templates/:template_id", getTemplateById);

router.post("/designs/submit", submitDesign);
router.get("/designs/my-submissions", getMyDesignSubmissions);
router.post("/designs/verify", verifyDesignId);
router.get("/designs/:design_id", getApprovedDesignById);

export default router;
