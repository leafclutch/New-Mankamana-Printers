import { randomUUID } from "crypto";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL || "";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

const supabase = createClient(supabaseUrl, supabaseKey);

// uploadFileToSupabase: Core utility to upload a file buffer to Supabase Storage and return the public URL
export const uploadFileToSupabase = async (file: Express.Multer.File, folder: string): Promise<string> => {
  const fileExt = file.originalname.split(".").pop();
  const fileName = `${folder}/${randomUUID()}.${fileExt}`;

  // Upload to public bucket 'printing-assets' as required or default
  const { data, error } = await supabase.storage
    .from("printing-assets") // Or read from env
    .upload(fileName, file.buffer, {
      contentType: file.mimetype,
      upsert: true,
    });

  if (error) {
    throw new Error(`Supabase upload failed: ${error.message}`);
  }

  const { data: publicData } = supabase.storage.from("printing-assets").getPublicUrl(fileName);

  return publicData.publicUrl;
};
