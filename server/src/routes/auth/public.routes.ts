import { Router } from "express";
import { validate } from "../../middleware/validate.middleware";
import { protect } from "../../middleware/auth.middleware";
import * as adminController from "../../controller/admin/admin.controller";
import * as serviceController from "../../controller/printing-service.controller";
import * as publicCatalogController from "../../controller/catalog/public-catalog.controller";
import { createRegistrationRequestSchema } from "../../validators/registration.validator";
import { trackPageView } from "../../controller/analytics/analytics.controller";

const router = Router();

// CLIENT SELF-REGISTRATION: Open endpoint for new clients to submit a registration request
router.post(
  "/register-request",
  validate(createRegistrationRequestSchema),
  adminController.createRegistrationRequest
);

// PRINTING SERVICES: Look up available printing services and their details
router.get("/services", serviceController.getServices);
router.get("/services/:serviceId", serviceController.getServiceById);

// CLIENT CATALOG APIs: Browse products, variants, options, and calculate exact-match pricing
router.get("/products", protect, publicCatalogController.getProductsController);
router.get("/products/:productId/variants", protect, publicCatalogController.getProductVariantsController);
router.get("/variants/:variantId/options", protect, publicCatalogController.getVariantOptionsController);
router.post("/pricing/calculate", protect, publicCatalogController.calculatePricingController);

// LEGACY CATALOG API: Retained for backwards compatibility
router.post("/variants/:variantId/calculate-price", publicCatalogController.calculatePriceController);

// ANALYTICS: Public page-view tracking (no auth required)
router.post("/analytics/pageview", trackPageView);

export default router;
