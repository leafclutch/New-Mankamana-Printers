import { Router } from "express";
import { uploadFile } from "../controller/upload.controller";
import multer from "multer";

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

// Unified upload endpoint to handle file uploads to Cloud/Supabase storage
router.post("/", upload.single("file"), uploadFile);

export default router;
