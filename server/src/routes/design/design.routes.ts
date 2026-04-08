import { Router } from "express";
import { protect, restrictTo } from "../../middleware/auth.middleware";
import { getMyDesigns, getMyDesignById, verifyDesignId } from "../../controller/design/approved-design.controller";

const router = Router();

// Client routes: View validated designs and verify public design codes
router.get("/designs/my", protect, restrictTo("CLIENT"), getMyDesigns);
router.get("/my-designs/:designId", protect, restrictTo("CLIENT"), getMyDesignById);
router.post("/designs/verify", protect, restrictTo("CLIENT"), verifyDesignId);

export default router;
