import { Router } from "express";
import multer from "multer";
import { protect, restrictTo } from "../../middleware/auth.middleware";
import { createPaymentDetails } from "../../controller/wallet/payment-details.controller";
import { getAdminTopupRequests, getAdminTopupRequestById, approveTopupRequest, rejectTopupRequest } from "../../controller/wallet/topup-request.controller";
import { getAdminTransactions } from "../../controller/wallet/wallet-transaction.controller";
import { getAdminNotifications, markAdminNotificationRead, getAdminClientWalletSummary } from "../../controller/wallet/wallet-notification.controller";

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (_req, file, cb) => {
    if (["image/png", "image/jpeg", "image/jpg"].includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only png, jpg, jpeg images are allowed for QR code"));
    }
  },
});

// All admin wallet routes require ADMIN auth
router.use(protect, restrictTo("ADMIN"));

// Payment details management: Define the platform's bank/QR details for top-ups
router.post("/payment-details", upload.single("qrImage"), createPaymentDetails);

// Top-up request management: Review and process client balance top-up submissions
router.get("/topup-requests", getAdminTopupRequests);
router.get("/topup-requests/:requestId", getAdminTopupRequestById);
router.post("/topup-requests/:requestId/approve", approveTopupRequest);
router.patch("/topup-requests/:requestId/reject", rejectTopupRequest);

// Transaction log: View all financial wallet movements across the platform
router.get("/transactions", getAdminTransactions);

// Notifications: Admin-specific alerts and read-status management
router.get("/notifications", getAdminNotifications);
router.patch("/notifications/:notificationId/read", markAdminNotificationRead);

// Client wallet summary: Fetch a specific client's financial status
router.get("/clients/:clientId", getAdminClientWalletSummary);

export default router;
