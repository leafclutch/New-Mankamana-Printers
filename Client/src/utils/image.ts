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
const SUPABASE_HOST_RE = /\.supabase\.co$/i;
const SUPABASE_PUBLIC_OBJECT_PATH = "/storage/v1/object/public/";

function isInvalidSupabaseStorageUrl(value: string): boolean {
  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    return true;
  }

  if (!SUPABASE_HOST_RE.test(parsed.hostname)) return false;
  if (!parsed.pathname.includes(SUPABASE_PUBLIC_OBJECT_PATH)) return false;

  // Require both bucket name and object key in the public object URL path.
  // Example valid pattern: /storage/v1/object/public/<bucket>/<object-key>
  const [, objectPath = ""] = parsed.pathname.split(SUPABASE_PUBLIC_OBJECT_PATH);
  const segments = objectPath.split("/").filter(Boolean);
  return segments.length < 2;
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
