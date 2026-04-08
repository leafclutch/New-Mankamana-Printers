import { Router } from "express";
import multer from "multer";
import * as orderController from "../../controller/orders/product-order.controller";
import { protect, restrictTo } from "../../middleware/auth.middleware";
import { confirmWalletPayment } from "../../controller/wallet/wallet-transaction.controller";

const router = Router();

// Multer: accept payment proof image/pdf with 10MB limit
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ["image/png", "image/jpeg", "image/jpg", "application/pdf"];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only png, jpg, jpeg, pdf files are allowed for payment proof"));
    }
  },
});

// CLIENT ROUTES
router.post(
  "/",
  protect,
  restrictTo("CLIENT"),
  upload.single("paymentProof"),
  orderController.createProductOrder
);

router.get(
  "/",
  protect,
  restrictTo("CLIENT"),
  orderController.getMyOrders
);

router.get(
  "/:orderId",
  protect,
  restrictTo("CLIENT"),
  orderController.getOrderDetails
);

router.post(
  "/:orderId/confirm-wallet-payment",
  protect,
  restrictTo("CLIENT"),
  confirmWalletPayment
);

export default router;
