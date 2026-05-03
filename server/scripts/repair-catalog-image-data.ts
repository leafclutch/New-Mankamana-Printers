import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { createClient } from "@supabase/supabase-js";

type SupabasePublicPath = {
  bucket: string;
  objectPath: string;
};

const prisma = new PrismaClient();

const supabaseUrl = process.env.SUPABASE_URL ?? "";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_ANON_KEY ?? "";
const supabase = createClient(supabaseUrl, supabaseKey);

const APPLY = process.argv.includes("--apply");
const VERBOSE = process.argv.includes("--verbose");

const IMAGE_EXT_RE = /\.(avif|bmp|gif|heic|heif|jpe?g|png|svg|tiff?|webp)$/i;
const HTTP_RE = /^https?:\/\//i;
const SUPABASE_PUBLIC_MARKER = "/storage/v1/object/public/";

const existsCache = new Map<string, Promise<boolean>>();

function toUnique(values: string[]): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const value of values) {
    const next = value.trim();
    if (!next || seen.has(next)) continue;
    seen.add(next);
    out.push(next);
  }
  return out;
}

function stripQueryAndHash(value: string): string {
  return value.split("?")[0].split("#")[0];
}

function filenameFromPath(path: string): string {
  return stripQueryAndHash(path).split("/").filter(Boolean).pop() ?? "";
}

function isHttpUrl(value: string): boolean {
  return HTTP_RE.test(value.trim());
}

function looksLikeImageFile(value: string): boolean {
  return IMAGE_EXT_RE.test(filenameFromPath(value));
}

function parseSupabasePublicUrl(value: string): SupabasePublicPath | null {
  try {
    const parsed = new URL(value);
    const idx = parsed.pathname.indexOf(SUPABASE_PUBLIC_MARKER);
    if (idx < 0) return null;
    const rest = parsed.pathname.slice(idx + SUPABASE_PUBLIC_MARKER.length);
    const parts = rest.split("/").filter(Boolean);
    if (parts.length < 2) return null;
    return { bucket: parts[0], objectPath: parts.slice(1).join("/") };
  } catch {
    return null;
  }
}

function folderOf(path: string): string {
  const clean = stripQueryAndHash(path);
  const idx = clean.lastIndexOf("/");
  return idx > 0 ? clean.slice(0, idx) : "";
}

async function supabaseObjectExists(bucket: string, objectPath: string): Promise<boolean> {
  const filename = filenameFromPath(objectPath);
  if (!filename) return false;
  const folder = folderOf(objectPath);
  const { data, error } = await supabase.storage
    .from(bucket)
    .list(folder, { limit: 100, search: filename });
  if (error) return false;
  return (data ?? []).some((entry) => entry.name === filename && Boolean(entry.id));
}

async function remoteUrlExists(url: string): Promise<boolean> {
  try {
    const head = await fetch(url, { method: "HEAD" });
    if (head.ok) return true;
  } catch {
    // ignore and fallback to GET
  }

  try {
    const get = await fetch(url, {
      method: "GET",
      headers: { Range: "bytes=0-0" },
    });
    return get.ok;
  } catch {
    return false;
  }
}

async function urlExists(url: string): Promise<boolean> {
  const key = url.trim();
  if (!key) return false;
  const cached = existsCache.get(key);
  if (cached) return cached;

  const promise = (async () => {
    if (!isHttpUrl(key)) return false;
    if (!looksLikeImageFile(key)) return false;

    const supabasePath = parseSupabasePublicUrl(key);
    if (supabasePath) {
      return supabaseObjectExists(supabasePath.bucket, supabasePath.objectPath);
    }

    return remoteUrlExists(key);
  })();

  existsCache.set(key, promise);
  return promise;
}

async function listFilesFromFolderUrl(folderUrl: string): Promise<string[]> {
  const parsed = parseSupabasePublicUrl(folderUrl);
  if (!parsed) return [];
  if (looksLikeImageFile(parsed.objectPath)) return [];

  const { data, error } = await supabase.storage
    .from(parsed.bucket)
    .list(parsed.objectPath, { limit: 200, sortBy: { column: "name", order: "asc" } });
  if (error) return [];

  const urls = (data ?? [])
    .filter((entry) => Boolean(entry.id))
    .map((entry) => `${parsed.objectPath}/${entry.name}`)
    .filter((path) => looksLikeImageFile(path))
    .map((path) => supabase.storage.from(parsed.bucket).getPublicUrl(path).data.publicUrl);

  return toUnique(urls);
}

function sameStringArray(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i += 1) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

async function run() {
  if (!supabaseUrl || !supabaseKey) {
    throw new Error("SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is missing.");
  }

  const products = await prisma.product.findMany({
    where: { is_active: true },
    select: {
      id: true,
      product_code: true,
      name: true,
      image_url: true,
      preview_images: true,
      group_id: true,
    },
    orderBy: { created_at: "asc" },
  });

  const productUpdates: Array<{
    id: string;
    product_code: string;
    name: string;
    image_url: string | null;
    preview_images: string[];
    reasons: string[];
  }> = [];

  const finalProductImageById = new Map<string, string | null>();
  const finalProductPreviewById = new Map<string, string[]>();

  for (const product of products) {
    const reasons: string[] = [];
    const rawPreview = Array.isArray(product.preview_images) ? product.preview_images : [];

    const folderDerived =
      product.image_url && isHttpUrl(product.image_url) && !looksLikeImageFile(product.image_url)
        ? await listFilesFromFolderUrl(product.image_url)
        : [];

    if (folderDerived.length > 0) {
      reasons.push(`derived ${folderDerived.length} image(s) from folder-like primary URL`);
    }

    const previewCandidates = toUnique([...rawPreview, ...folderDerived]);
    const validPreview: string[] = [];
    for (const url of previewCandidates) {
      if (await urlExists(url)) validPreview.push(url);
      else if (VERBOSE) reasons.push(`dropped broken preview URL: ${url}`);
    }

    const validPrimary =
      typeof product.image_url === "string" && (await urlExists(product.image_url))
        ? product.image_url
        : null;

    if (!validPrimary && product.image_url) {
      reasons.push("primary image URL is missing or unreachable");
    }

    const nextImageUrl = validPrimary ?? validPreview[0] ?? null;
    const nextPreviewImages = toUnique(validPreview);

    finalProductImageById.set(product.id, nextImageUrl);
    finalProductPreviewById.set(product.id, nextPreviewImages);

    const changedImage = (product.image_url ?? null) !== nextImageUrl;
    const changedPreview = !sameStringArray(rawPreview, nextPreviewImages);
    if (changedImage || changedPreview) {
      productUpdates.push({
        id: product.id,
        product_code: product.product_code,
        name: product.name,
        image_url: nextImageUrl,
        preview_images: nextPreviewImages,
        reasons,
      });
    }
  }

  const groups = await prisma.productGroup.findMany({
    where: { is_active: true },
    select: {
      id: true,
      name: true,
      image_url: true,
      category: { select: { image_url: true } },
      products: {
        where: { is_active: true },
        select: { id: true },
      },
    },
    orderBy: { created_at: "asc" },
  });

  const groupUpdates: Array<{ id: string; name: string; image_url: string | null; reason: string }> = [];

  for (const group of groups) {
    const validCurrent =
      typeof group.image_url === "string" && (await urlExists(group.image_url))
        ? group.image_url
        : null;

    if (validCurrent) continue;

    let fallback: string | null = null;
    if (group.category?.image_url && (await urlExists(group.category.image_url))) {
      fallback = group.category.image_url;
    }

    if (!fallback) {
      for (const productRef of group.products) {
        const productImage = finalProductImageById.get(productRef.id) ?? null;
        if (productImage && (await urlExists(productImage))) {
          fallback = productImage;
          break;
        }

        const productPreview = finalProductPreviewById.get(productRef.id) ?? [];
        const previewHit = productPreview.find((url) => Boolean(url));
        if (previewHit) {
          fallback = previewHit;
          break;
        }
      }
    }

    if ((group.image_url ?? null) !== (fallback ?? null)) {
      groupUpdates.push({
        id: group.id,
        name: group.name,
        image_url: fallback ?? null,
        reason: fallback
          ? "set group image from category/product fallback"
          : "cleared broken group image",
      });
    }
  }

  console.log(
    JSON.stringify(
      {
        mode: APPLY ? "apply" : "dry-run",
        scanned: {
          products: products.length,
          groups: groups.length,
        },
        changes: {
          products: productUpdates.length,
          groups: groupUpdates.length,
        },
        samples: {
          productUpdates: productUpdates.slice(0, 20),
          groupUpdates: groupUpdates.slice(0, 20),
        },
      },
      null,
      2
    )
  );

  if (!APPLY) {
    console.log("Dry-run only. Re-run with --apply to persist changes.");
    return;
  }

  for (const update of productUpdates) {
    await prisma.product.update({
      where: { id: update.id },
      data: {
        image_url: update.image_url,
        preview_images: update.preview_images,
      },
    });
  }

  for (const update of groupUpdates) {
    await prisma.productGroup.update({
      where: { id: update.id },
      data: { image_url: update.image_url },
    });
  }

  console.log(`Applied ${productUpdates.length} product updates and ${groupUpdates.length} group updates.`);
}

run()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
