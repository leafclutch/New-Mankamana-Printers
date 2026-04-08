import { Router } from "express";
import {
  getRegistrationRequests,
  getRegistrationRequestById,
  approveRegistrationRequest,
  rejectRegistrationRequest,
  getPendingDesignSubmissions,
  getDesignSubmissionById,
  approveDesignSubmission,
  rejectDesignSubmission,
  getApprovedDesigns,
  getApprovedDesignByIdAdmin,
  deleteApprovedDesign,
  loginAdmin,
  logoutAdmin
} from "../controller/admin.controller";
import { protect, restrictTo } from "../middleware/auth.middleware";
import { validate } from "../middleware/validate.middleware";
import { loginSchema } from "../validators/auth.validators";

const router = Router();

// Public Route
router.post("/login", validate(loginSchema), loginAdmin);

// Protect all routes after this middleware
router.use(protect);
router.use(restrictTo("ADMIN"));

router.post("/logout", logoutAdmin);

router.get("/registration-requests", getRegistrationRequests);

router.get(
  "/registration-requests/:request_id",
  getRegistrationRequestById
);

router.post(
  "/registration-requests/:request_id/approve",
  approveRegistrationRequest
);

router.patch(
  "/registration-requests/:request_id/reject",
  rejectRegistrationRequest
);

router.get("/designs/submissions", getPendingDesignSubmissions);
router.get("/designs/submissions/:submission_id", getDesignSubmissionById);
router.post("/designs", approveDesignSubmission);
router.patch("/designs/submissions/:submission_id/reject", rejectDesignSubmission);
router.get("/designs", getApprovedDesigns);
router.get("/designs/:design_id", getApprovedDesignByIdAdmin);
router.delete("/designs/:design_id", deleteApprovedDesign);

export default router;