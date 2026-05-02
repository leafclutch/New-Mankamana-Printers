import path from "path";
import { Router } from "express";
import { uploadFile, deleteFile } from "../controller/upload.controller";
import { protect } from "../middleware/auth.middleware";
import multer from "multer";

const router = Router();

const ALLOWED_MIME_TYPES = new Set([
  // Images
  "image/jpeg", "image/png", "image/gif", "image/webp", "image/tiff",
  // Documents
  "application/pdf",
  // Archives
  "application/zip", "application/x-zip-compressed", "application/x-zip",
  // Design formats
  "application/postscript",          // EPS, AI
  "image/vnd.adobe.photoshop",       // PSD
  "application/photoshop",           // PSD (alternate)
  "application/x-photoshop",         // PSD (alternate)
  "application/x-cdr",               // CorelDRAW CDR
  "application/cdr",                 // CorelDRAW CDR (alternate)
]);

// Design file extensions often arrive as application/octet-stream from some OS/browser combos
const ALLOWED_EXTENSIONS = new Set([
  ".jpg", ".jpeg", ".png", ".gif", ".webp", ".tiff", ".tif",
  ".pdf",
  ".zip",
  ".eps", ".ai",
  ".psd",
  ".cdr",
]);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 }, // 50 MB for design files
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (ALLOWED_MIME_TYPES.has(file.mimetype) || ALLOWED_EXTENSIONS.has(ext)) {
      cb(null, true);
    } else {
      cb(new Error(`File type not allowed. Accepted: images, PDF, ZIP, EPS, AI, PSD, CDR, TIFF.`));
    }
  },
});

// Requires authentication — unauthenticated upload was a security hole
router.post("/", protect, upload.single("file"), uploadFile);
router.delete("/", protect, deleteFile);

export default router;
