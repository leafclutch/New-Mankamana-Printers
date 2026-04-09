import { supabase } from "./supabase";
import { v4 as uuidv4 } from "uuid";

// uploadToSupabase: Processes file uploads to Supabase Storage and returns the public URL
export const uploadToSupabase = async (
  file: Express.Multer.File,
  folder: string = "uploads"
): Promise<string> => {
  const bucketName = process.env.SUPABASE_BUCKET || "printing-assets";

  // Check if bucket exists and try to create it if not (optional, might fail with anon key)
  const { data: buckets } = await supabase.storage.listBuckets();
  const bucketExists = buckets?.some(b => b.name === bucketName);
  
  if (!bucketExists) {
    console.log(`Bucket ${bucketName} not found, attempting to create...`);
    await supabase.storage.createBucket(bucketName, {
      public: true,
      fileSizeLimit: 52428800, // 50MB
    });
  }

  // Derive extension from MIME type (not user-supplied filename) to prevent extension spoofing
  const MIME_TO_EXT: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/gif": "gif",
    "image/webp": "webp",
    "application/pdf": "pdf",
  };
  const fileExtension = MIME_TO_EXT[file.mimetype] ?? "bin";
  const fileName = `${folder}/${uuidv4()}.${fileExtension}`;

  const { data, error } = await supabase.storage
    .from(bucketName)
    .upload(fileName, file.buffer, {
      contentType: file.mimetype,
      upsert: true,
    });

  if (error) {
    console.error("Supabase upload error:", error);
    throw new Error(`Failed to upload file to Supabase: ${error.message}`);
  }

  // Get the public URL
  const { data: publicUrlData } = supabase.storage
    .from(bucketName)
    .getPublicUrl(fileName);

  return publicUrlData.publicUrl;
};
