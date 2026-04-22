import { Request, Response } from "express";
import { uploadToSupabasePath, getSupabasePublicUrl, deleteFromSupabase } from "../utils/file-upload";

// Folders that callers are permitted to upload into via the generic /uploads endpoint
const ALLOWED_FOLDERS = new Set([
  "general",
  "designs/submissions",
  "designs/approved",
  "orders/payment-proofs",
  "wallet/payment-proofs",
  "templates/general",
  "products/images",
  "profile",
  "qr-codes",
]);

// uploadFile: Generic handler to upload a single file to Supabase storage, with optional folder specification
// Returns both the file path (for DB storage) and the full public URL (for immediate display)
export const uploadFile = async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "No file uploaded" });
    }

    const requestedFolder = String(req.body.folder || "general");
    // Also allow order attachment batches: orders/batch-{uuid}
    const isOrderBatch = /^orders\/batch-[0-9a-f-]{36}$/.test(requestedFolder);
    const folder = ALLOWED_FOLDERS.has(requestedFolder) || isOrderBatch ? requestedFolder : "general";

    const { path: filePath, bucket, isPrivate } = await uploadToSupabasePath(req.file, folder);
    const fileUrl = isPrivate ? filePath : getSupabasePublicUrl(filePath, bucket);

    res.status(200).json({
      success: true,
      message: "File uploaded successfully",
      data: { filePath, fileUrl },
    });
  } catch (error: any) {
    console.error("Upload Error:", error.message);
    res.status(500).json({ success: false, message: error.message || "Failed to upload file" });
  }
};

// deleteFile: Removes a previously uploaded order-attachment batch file.
// Only allows deletion of paths under orders/batch-{uuid}/ to prevent abuse.
export const deleteFile = async (req: Request, res: Response) => {
  try {
    const filePath = req.body?.path as string | undefined;
    if (!filePath || typeof filePath !== "string") {
      return res.status(400).json({ success: false, message: "path is required" });
    }
    if (!/^orders\/batch-[0-9a-f-]{36}\//.test(filePath)) {
      return res.status(403).json({ success: false, message: "Deletion not permitted for this path" });
    }
    await deleteFromSupabase(filePath);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
