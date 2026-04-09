import { supabase } from "./supabase";
import { v4 as uuidv4 } from "uuid";

// MIME type → file extension mapping (extension from MIME, not from user-supplied filename)
const MIME_TO_EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/gif": "gif",
  "image/webp": "webp",
  "application/pdf": "pdf",
};

/**
 * uploadToSupabase
 *
 * Uploads a Multer file to the `printing-assets` Supabase bucket.
 *
 * Folder structure inside the bucket:
 *   designs/submissions/      – client design submissions awaiting review
 *   designs/approved/         – admin-approved design files
 *   templates/{category-slug}/– free design templates, organised by category
 *   orders/payment-proofs/    – payment proof screenshots/PDFs for orders
 *   wallet/payment-proofs/    – payment proof screenshots/PDFs for wallet top-ups
 *   products/images/          – product catalogue images
 *   qr-codes/                 – generated QR code images
 *   general/                  – catch-all for everything else
 */
export const uploadToSupabase = async (
  file: Express.Multer.File,
  folder: string = "general"
): Promise<string> => {
  const bucketName = process.env.SUPABASE_BUCKET || "printing-assets";

  // Ensure the bucket exists (no-op if it already does)
  const { data: buckets } = await supabase.storage.listBuckets();
  const bucketExists = buckets?.some((b) => b.name === bucketName);
  if (!bucketExists) {
    await supabase.storage.createBucket(bucketName, {
      public: true,
      fileSizeLimit: 52428800, // 50 MB
    });
  }

  const fileExtension = MIME_TO_EXT[file.mimetype] ?? "bin";
  const fileName = `${folder}/${uuidv4()}.${fileExtension}`;

  const { error } = await supabase.storage
    .from(bucketName)
    .upload(fileName, file.buffer, {
      contentType: file.mimetype,
      upsert: false, // never silently overwrite
    });

  if (error) {
    console.error("Supabase upload error:", error);
    throw new Error(`Failed to upload file to Supabase: ${error.message}`);
  }

  const { data: publicUrlData } = supabase.storage
    .from(bucketName)
    .getPublicUrl(fileName);

  return publicUrlData.publicUrl;
};

// uploadFileToSupabase: Thin alias used by the generic upload controller
export const uploadFileToSupabase = uploadToSupabase;
