import { Request, Response } from "express";
import { uploadFileToSupabase } from "../services/upload.service";

// uploadFile: Generic handler to upload a single file to Supabase storage, with optional folder specification
export const uploadFile = async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "No file uploaded" });
    }

    const { folder } = req.body;
    const fileUrl = await uploadFileToSupabase(req.file, folder || "general");

    res.status(200).json({
      success: true,
      message: "File uploaded successfully",
      data: {
        fileUrl,
      },
    });
  } catch (error) {
    console.error("Upload Error:", error);
    res.status(500).json({ success: false, message: "Failed to upload file" });
  }
};
