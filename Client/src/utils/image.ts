const INVALID_IMAGE_VALUES = new Set([
  "",
  "null",
  "undefined",
  "none",
  "n/a",
  "na",
]);

const HTTP_URL_RE = /^https?:\/\//i;
const BLOB_URL_RE = /^blob:/i;
const DATA_IMAGE_RE = /^data:image\//i;
const IMAGE_EXTENSION_RE = /\.(?:apng|avif|bmp|gif|heic|heif|ico|jpe?g|png|svg|webp)$/i;
const SUPABASE_HOST_RE = /\.supabase\.co$/i;
const SUPABASE_PUBLIC_OBJECT_PATH = "/storage/v1/object/public/";

function hasImageExtension(pathname: string): boolean {
  const lastSegment = pathname.split("/").pop() ?? "";
  return IMAGE_EXTENSION_RE.test(lastSegment);
}

function isInvalidSupabaseStorageUrl(value: string): boolean {
  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    return true;
  }

  if (!SUPABASE_HOST_RE.test(parsed.hostname)) return false;
  if (!parsed.pathname.includes(SUPABASE_PUBLIC_OBJECT_PATH)) return false;

  // Supabase public object URLs should point to an actual file.
  // Folder-like paths (for example ".../images") are not renderable images.
  return !hasImageExtension(parsed.pathname);
}

export function normalizeImageUrl(raw: string | null | undefined): string | null {
  if (typeof raw !== "string") return null;

  const value = raw.trim();
  if (!value) return null;

  const lower = value.toLowerCase();
  if (INVALID_IMAGE_VALUES.has(lower)) return null;

  if (HTTP_URL_RE.test(value)) {
    if (isInvalidSupabaseStorageUrl(value)) return null;
    return value;
  }

  if (BLOB_URL_RE.test(value) || DATA_IMAGE_RE.test(value)) {
    return value;
  }

  if (value.startsWith("/")) {
    return value;
  }

  return null;
}

export function uniqueImageUrls(values: Array<string | null | undefined>): string[] {
  const urls: string[] = [];
  const seen = new Set<string>();

  for (const value of values) {
    const normalized = normalizeImageUrl(value);
    if (!normalized || seen.has(normalized)) continue;
    seen.add(normalized);
    urls.push(normalized);
  }

  return urls;
}
