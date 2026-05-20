import { Router } from "express";
import { protect, restrictTo } from "../../middleware/auth.middleware";
import * as machineryController from "../../controller/catalog/machinery-catalog.controller";
import rateLimit from "express-rate-limit";
import { requireIdempotencyKey } from "../../middleware/idempotency.middleware";

const criticalActionRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many critical action requests. Please slow down." },
});

const router = Router();

router.get("/machinery/groups", protect, restrictTo("ADMIN"), machineryController.listMachineryGroupsController);
router.post("/machinery/groups", protect, restrictTo("ADMIN"), criticalActionRateLimiter, requireIdempotencyKey, machineryController.createMachineryGroupController);
router.patch("/machinery/groups/:groupId", protect, restrictTo("ADMIN"), criticalActionRateLimiter, requireIdempotencyKey, machineryController.updateMachineryGroupController);
router.post("/machinery/groups/:groupId/products", protect, restrictTo("ADMIN"), criticalActionRateLimiter, requireIdempotencyKey, machineryController.createMachineryProductController);
router.get("/machinery/products", protect, restrictTo("ADMIN"), machineryController.listMachineryProductsController);

export default router;
