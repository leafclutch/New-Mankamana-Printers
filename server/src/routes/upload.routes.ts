import { Router } from "express";
import { uploadFile, deleteFile } from "../controller/upload.controller";
import { protect } from "../middleware/auth.middleware";
import multer from "multer";

const router = Router();

const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "application/pdf",
]);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_MIME_TYPES.has(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`File type '${file.mimetype}' is not allowed. Only images and PDFs are accepted.`));
    }
  },
});

// Requires authentication — unauthenticated upload was a security hole
router.post("/", protect, upload.single("file"), uploadFile);
router.delete("/", protect, deleteFile);

export default router;
