import { randomUUID } from "crypto";
import { supabase } from "./supabase";
import { withRetry } from "./resilience";

// MIME type → file extension mapping (extension from MIME, not from user-supplied filename)
const MIME_TO_EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/png": "png",
  "image/gif": "gif",
  "image/webp": "webp",
  "image/bmp": "bmp",
  "image/tiff": "tiff",
  "image/svg+xml": "svg",
  "image/heic": "heic",
  "image/heif": "heif",
  "application/pdf": "pdf",
  "application/msword": "doc",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
};

/**
 * Bucket routing table.
 * Maps a folder prefix to the correct Supabase bucket.
 * More specific prefixes must come before less specific ones.
 */
const FOLDER_TO_BUCKET: { prefix: string; bucket: string; isPrivate: boolean }[] = [
  { prefix: "designs/submissions",   bucket: "design-files",       isPrivate: true  },
  { prefix: "designs/approved",      bucket: "design-files",       isPrivate: true  },
  { prefix: "orders/payment-proofs", bucket: "payment-proofs",     isPrivate: true  },
  { prefix: "orders/",               bucket: "order-attachments",  isPrivate: true  },
  { prefix: "wallet/payment-proofs", bucket: "payment-proofs",     isPrivate: true  },
  { prefix: "templates",             bucket: "design-templates",   isPrivate: false },
  { prefix: "products",              bucket: "product-assets",     isPrivate: false },
  { prefix: "banners",               bucket: "banners",            isPrivate: false },
  { prefix: "company",               bucket: "product-assets",     isPrivate: false },
  { prefix: "option-values",         bucket: "product-assets",     isPrivate: false },
  { prefix: "qr-codes",              bucket: "product-assets",     isPrivate: false },
];

const FALLBACK_BUCKET = process.env.SUPABASE_BUCKET || "printing-assets";

function resolveBucket(folder: string): { bucket: string; isPrivate: boolean } {
  const match = FOLDER_TO_BUCKET.find((r) => folder.startsWith(r.prefix));
  return match ?? { bucket: FALLBACK_BUCKET, isPrivate: false };
}

// ─── Bucket auto-provisioning ────────────────────────────────────────────────
// Track which buckets have been verified this process lifetime so we only call
// listBuckets/createBucket once per bucket, not on every upload.
const provisionedBuckets = new Set<string>();

async function ensureBucketExists(bucket: string, isPrivate: boolean): Promise<void> {
  if (provisionedBuckets.has(bucket)) return;

  const { data: list, error: listErr } = await supabase.storage.listBuckets();
  if (listErr) {
    // Cannot list buckets (permissions issue) — mark as provisioned to avoid
    // hammering listBuckets on every upload; the upload itself will surface the real error.
    console.warn(`[Storage] Cannot list buckets: ${listErr.message}`);
    provisionedBuckets.add(bucket);
    return;
  }

  const exists = list?.some((b) => b.name === bucket) ?? false;
  if (!exists) {
    console.log(`[Storage] Bucket '${bucket}' not found — creating it now`);
    const { error: createErr } = await supabase.storage.createBucket(bucket, {
      public: !isPrivate,
    });
    if (createErr && !createErr.message.toLowerCase().includes("already exists")) {
      throw new Error(`Cannot create storage bucket '${bucket}': ${createErr.message}`);
    }
    console.log(`[Storage] Bucket '${bucket}' created (public=${!isPrivate})`);
  }

  provisionedBuckets.add(bucket);
}
// ─────────────────────────────────────────────────────────────────────────────

export const getSupabasePublicUrl = (filePath: string, bucket?: string): string => {
  const resolvedBucket = bucket ?? FALLBACK_BUCKET;
  const { data } = supabase.storage.from(resolvedBucket).getPublicUrl(filePath);
  return data.publicUrl;
};

export const getPublicUrlForPath = (filePath: string): string => {
  const { bucket } = resolveBucket(filePath);
  const { data } = supabase.storage.from(bucket).getPublicUrl(filePath);
  return data.publicUrl;
};

export const getSignedUrl = async (
  filePath: string,
  bucket: string,
  expiresIn = 3600
): Promise<string> => {
  const { data, error } = await withRetry(
    () => supabase.storage.from(bucket).createSignedUrl(filePath, expiresIn),
    { retries: 2, timeoutMs: 8000, backoffMs: 250 }
  );
  if (error || !data?.signedUrl) {
    throw new Error(`Failed to generate signed URL: ${error?.message}`);
  }
  return data.signedUrl;
};

/**
 * uploadToSupabasePath
 * Uploads a Multer file to the correct bucket based on the folder prefix.
 * Auto-creates the bucket if it doesn't exist.
 * Returns the file PATH (not a URL) — callers use getSignedUrl for private files.
 */
export const uploadToSupabasePath = async (
  file: Express.Multer.File,
  folder: string = "general"
): Promise<{ path: string; bucket: string; isPrivate: boolean }> => {
  const { bucket, isPrivate } = resolveBucket(folder);

  // Ensure the destination bucket exists before attempting the upload.
  // This is a no-op after the first successful check for a given bucket name.
  await ensureBucketExists(bucket, isPrivate);

  const fileExtension = MIME_TO_EXT[file.mimetype] ?? "bin";
  const filePath = `${folder}/${randomUUID()}.${fileExtension}`;

  // NOTE: Supabase SDK never throws — it returns {data, error}. withRetry only
  // retries on thrown exceptions (i.e. timeouts). The error check below handles
  // Supabase-level errors (wrong bucket, permission denied, etc.).
  const { error } = await withRetry(
    () =>
      supabase.storage.from(bucket).upload(filePath, file.buffer, {
        contentType: file.mimetype,
        upsert: false,
      }),
    { retries: 2, timeoutMs: 10000, backoffMs: 300 }
  );

  if (error) {
    console.error(`[Storage] Upload failed [bucket=${bucket}, path=${filePath}]:`, error);
    throw new Error(`Storage upload failed (bucket: ${bucket}): ${error.message}`);
  }

  return { path: filePath, bucket, isPrivate };
};

export const deleteFromSupabase = async (filePath: string, bucket?: string): Promise<void> => {
  // resolveBucket needs the full path prefix, not just the first segment
  const resolvedBucket = bucket ?? resolveBucket(filePath).bucket;
  const { error } = await withRetry(
    () => supabase.storage.from(resolvedBucket).remove([filePath]),
    { retries: 1, timeoutMs: 8000, backoffMs: 200, fallback: async () => ({ data: null, error: null }) }
  );
  if (error) {
    console.error("[Storage] Delete error:", error);
  }
};

export const moveInSupabase = async (fromPath: string, toPath: string): Promise<void> => {
  const { bucket } = resolveBucket(fromPath);
  const { error } = await supabase.storage.from(bucket).move(fromPath, toPath);
  if (error) throw new Error(`Failed to move '${fromPath}' → '${toPath}': ${error.message}`);
};

export const downloadFromSupabase = async (
  filePath: string
): Promise<{ buffer: Buffer; mimeType: string }> => {
  const { bucket } = resolveBucket(filePath);
  const { data, error } = await withRetry(
    () => supabase.storage.from(bucket).download(filePath),
    { retries: 2, timeoutMs: 10000, backoffMs: 300 }
  );
  if (error || !data) {
    throw new Error(`Failed to download '${filePath}' from bucket '${bucket}': ${error?.message}`);
  }
  const buffer = Buffer.from(await data.arrayBuffer());
  return { buffer, mimeType: data.type || "application/octet-stream" };
};

// uploadToSupabase: Returns public URL for public buckets, path for private buckets.
export const uploadToSupabase = async (
  file: Express.Multer.File,
  folder: string = "general"
): Promise<string> => {
  const { path, bucket, isPrivate } = await uploadToSupabasePath(file, folder);
  if (isPrivate) return path;
  return getSupabasePublicUrl(path, bucket);
};

// uploadFileToSupabase: Thin alias kept for legacy callers.
export const uploadFileToSupabase = async (
  file: Express.Multer.File,
  folder: string = "general"
): Promise<string> => {
  return uploadToSupabase(file, folder);
};
