import { Router } from "express";
import multer from "multer";
import { protect, restrictTo } from "../../middleware/auth.middleware";
import { getPaymentDetails } from "../../controller/wallet/payment-details.controller";
import { getWalletBalance, validateCheckout } from "../../controller/wallet/wallet-account.controller";
import { submitTopupRequest, getMyTopupRequests, getMyTopupRequestById } from "../../controller/wallet/topup-request.controller";
import { getWalletTransactions, confirmWalletPayment } from "../../controller/wallet/wallet-transaction.controller";
import { getClientNotifications, markClientNotificationRead } from "../../controller/wallet/wallet-notification.controller";

const router = Router();

// Multer memory storage for proof uploads to Supabase
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = ["image/png", "image/jpeg", "image/jpg", "application/pdf"];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(null, false);
      return cb(new Error("Only png, jpg, jpeg, pdf files are allowed"));
    }
  },
});

// All client wallet routes require CLIENT auth
router.use(protect, restrictTo("CLIENT"));

// Payment details: View platform bank details to make a transfer
router.get("/payment-details", getPaymentDetails);

// Top-up requests: Submit new proof of transfer and track personal requests
router.post("/topup-requests", upload.single("proofFile"), submitTopupRequest);
router.get("/topup-requests", getMyTopupRequests);
router.get("/topup-requests/:requestId", getMyTopupRequestById);

// Balance: Quick check of current available wallet funds
router.get("/balance", getWalletBalance);

// Transactions: Personal history of wallet credits and debits
router.get("/transactions", getWalletTransactions);

// Validate checkout: Verify if wallet has sufficient funds for a potential order
router.post("/validate-checkout", validateCheckout);

// Notifications: Personal wallet-related push alerts
router.get("/notifications", getClientNotifications);
router.patch("/notifications/:notificationId/read", markClientNotificationRead);



export default router;
