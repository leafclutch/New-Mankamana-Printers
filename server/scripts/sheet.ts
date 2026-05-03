import "dotenv/config";
import fs from "fs/promises";
import path from "path";
import { createClient } from "@supabase/supabase-js";
import prisma from "../src/connect";

type ProductRow = {
  id: string;
  product_code: string;
  name: string;
  category_slug: string | null;
};

type FolderRow = {
  relativeFolder: string;
  topCategory: string;
  folderName: string;
  imageFiles: string[];
  hints: string[];
};

type MatchRow = FolderRow & {
  product: ProductRow | null;
  confidence: number;
};

const SOURCE_ROOT = path.resolve(process.cwd(), "..", "Printers Club");
const OUTPUT_DIR = path.resolve(process.cwd(), "generated");
const OUTPUT_JSON = path.join(OUTPUT_DIR, "printers-club-sheet.json");
const OUTPUT_CSV = path.join(OUTPUT_DIR, "printers-club-sheet.csv");

const APPLY = process.argv.includes("--apply");
const VERBOSE = process.argv.includes("--verbose");

const SUPABASE_URL = process.env.SUPABASE_URL ?? "";
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_ANON_KEY ?? "";
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const IMAGE_EXT_RE = /\.(avif|bmp|gif|heic|heif|jpe?g|png|svg|tiff?|webp)$/i;

function normalize(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\w\s-]+/g, " ")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function slugify(value: string): string {
  return normalize(value)
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function tokenize(value: string): string[] {
  return normalize(value)
    .split(" ")
    .filter((token) => token.length >= 2);
}

function scoreText(productName: string, hint: string): number {
  const p = normalize(productName);
  const h = normalize(hint);
  if (!h) return 0;
  if (p === h) return 1;
  if (p.includes(h) || h.includes(p)) return 0.88;

  const pt = tokenize(productName);
  const ht = tokenize(hint);
  if (pt.length === 0 || ht.length === 0) return 0;

  const pSet = new Set(pt);
  let intersection = 0;
  for (const token of ht) {
    if (pSet.has(token)) intersection += 1;
  }

  const overlap = intersection / Math.max(ht.length, 1);
  const coverage = intersection / Math.max(pt.length, 1);
  return overlap * 0.7 + coverage * 0.3;
}

function bestProductMatch(products: ProductRow[], hints: string[]): { product: ProductRow | null; confidence: number } {
  let best: ProductRow | null = null;
  let bestScore = 0;

  for (const product of products) {
    let score = 0;
    for (const hint of hints) {
      score = Math.max(score, scoreText(product.name, hint));
    }
    if (score > bestScore) {
      bestScore = score;
      best = product;
    }
  }

  if (!best || bestScore < 0.45) return { product: null, confidence: bestScore };
  return { product: best, confidence: bestScore };
}

async function walkFolders(root: string): Promise<FolderRow[]> {
  const out: FolderRow[] = [];
  const stack = [root];

  while (stack.length > 0) {
    const dir = stack.pop() as string;
    const entries = await fs.readdir(dir, { withFileTypes: true });

    const files = entries
      .filter((entry) => entry.isFile() && IMAGE_EXT_RE.test(entry.name))
      .map((entry) => path.join(dir, entry.name));

    const childDirs = entries.filter((entry) => entry.isDirectory()).map((entry) => path.join(dir, entry.name));
    for (const child of childDirs) stack.push(child);

    if (files.length === 0) continue;

    const rel = path.relative(root, dir);
    const parts = rel.split(path.sep).filter(Boolean);
    const topCategory = parts[0] ?? "";
    const folderName = parts[parts.length - 1] ?? "";
    const parentName = parts.length >= 2 ? parts[parts.length - 2] : "";
    const hints = [folderName, parentName, `${parentName} ${folderName}`, rel.replace(/\\/g, " ")];

    out.push({
      relativeFolder: rel,
      topCategory,
      folderName,
      imageFiles: files,
      hints,
    });
  }

  return out;
}

async function uploadFilesForProduct(
  product: ProductRow,
  topCategoryHint: string,
  files: string[],
  bucket: string
): Promise<{ primary: string | null; previews: string[] }> {
  const categorySlug = product.category_slug ?? slugify(topCategoryHint || "uncategorized");
  const productSlug = slugify(product.name || product.product_code);
  const baseFolder = `${categorySlug}/general/${productSlug}/images`;

  const uploaded: string[] = [];
  for (const filePath of files) {
    const fileName = path.basename(filePath);
    const ext = path.extname(fileName) || ".jpg";
    const normalizedFileName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext.toLowerCase()}`;
    const storagePath = `${baseFolder}/${normalizedFileName}`;

    const buffer = await fs.readFile(filePath);
    const contentType =
      ext.toLowerCase() === ".png"
        ? "image/png"
        : ext.toLowerCase() === ".webp"
          ? "image/webp"
          : ext.toLowerCase() === ".gif"
            ? "image/gif"
            : "image/jpeg";

    const { error } = await supabase.storage
      .from(bucket)
      .upload(storagePath, buffer, { contentType, upsert: false });
    if (error) {
      throw new Error(`Upload failed for ${filePath}: ${error.message}`);
    }

    const publicUrl = supabase.storage.from(bucket).getPublicUrl(storagePath).data.publicUrl;
    uploaded.push(publicUrl);
  }

  return { primary: uploaded[0] ?? null, previews: uploaded };
}

function toCsv(rows: MatchRow[]): string {
  const headers = [
    "status",
    "category",
    "relative_folder",
    "image_count",
    "product_id",
    "product_code",
    "product_name",
    "confidence",
    "files",
  ];
  const lines = [headers.join(",")];

  for (const row of rows) {
    const status = row.product ? "matched" : "unmatched";
    const fields = [
      status,
      row.topCategory,
      row.relativeFolder,
      String(row.imageFiles.length),
      row.product?.id ?? "",
      row.product?.product_code ?? "",
      row.product?.name ?? "",
      row.confidence.toFixed(3),
      row.imageFiles.map((f) => path.basename(f)).join(" | "),
    ].map((value) => `"${String(value).replace(/"/g, '""')}"`);
    lines.push(fields.join(","));
  }

  return lines.join("\n");
}

async function main() {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    throw new Error("SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is missing.");
  }

  const preferredBucket = process.env.SUPABASE_BUCKET ?? "product-assets";
  const { data: buckets, error: bucketListError } = await supabase.storage.listBuckets();
  if (bucketListError) {
    throw new Error(`Could not list buckets: ${bucketListError.message}`);
  }
  const bucketNames = (buckets ?? []).map((bucket) => bucket.name);
  const resolvedBucket = bucketNames.includes(preferredBucket)
    ? preferredBucket
    : bucketNames.includes("product-assets")
      ? "product-assets"
      : null;

  if (!resolvedBucket) {
    throw new Error(
      `No writable target bucket found. Preferred='${preferredBucket}', available=${bucketNames.join(", ")}`
    );
  }

  const rootExists = await fs
    .stat(SOURCE_ROOT)
    .then((s) => s.isDirectory())
    .catch(() => false);
  if (!rootExists) {
    throw new Error(`Source folder not found: ${SOURCE_ROOT}`);
  }

  const products = await prisma.product.findMany({
    where: { is_active: true },
    select: {
      id: true,
      product_code: true,
      name: true,
      category: { select: { slug: true } },
    },
    orderBy: { created_at: "asc" },
  });

  const productRows: ProductRow[] = products.map((product) => ({
    id: product.id,
    product_code: product.product_code,
    name: product.name,
    category_slug: product.category?.slug ?? null,
  }));

  const folders = await walkFolders(SOURCE_ROOT);
  const matches: MatchRow[] = folders
    .map((folder) => {
      const matched = bestProductMatch(productRows, folder.hints);
      return { ...folder, product: matched.product, confidence: matched.confidence };
    })
    .sort((a, b) => b.confidence - a.confidence);

  const matched = matches.filter((row) => Boolean(row.product));
  const unmatched = matches.filter((row) => !row.product);

  await fs.mkdir(OUTPUT_DIR, { recursive: true });
  await fs.writeFile(
    OUTPUT_JSON,
    JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        sourceRoot: SOURCE_ROOT,
        applyMode: APPLY,
        uploadBucket: resolvedBucket,
        totalFolders: matches.length,
        matchedFolders: matched.length,
        unmatchedFolders: unmatched.length,
        rows: matches.map((row) => ({
          category: row.topCategory,
          relativeFolder: row.relativeFolder,
          imageCount: row.imageFiles.length,
          confidence: row.confidence,
          product: row.product,
          files: row.imageFiles.map((f) => path.relative(SOURCE_ROOT, f)),
        })),
      },
      null,
      2
    )
  );
  await fs.writeFile(OUTPUT_CSV, toCsv(matches));

  console.log(
    JSON.stringify(
      {
        success: true,
        applyMode: APPLY,
        uploadBucket: resolvedBucket,
        sourceRoot: SOURCE_ROOT,
        outputJson: OUTPUT_JSON,
        outputCsv: OUTPUT_CSV,
        totalFolders: matches.length,
        matchedFolders: matched.length,
        unmatchedFolders: unmatched.length,
      },
      null,
      2
    )
  );

  if (!APPLY) {
    console.log("Dry run complete. Re-run with --apply to upload files and update product images.");
    return;
  }

  const toApply = matches.filter((row) => row.product && row.confidence >= 0.65);
  const grouped = new Map<
    string,
    { product: ProductRow; topCategory: string; fileSet: Set<string>; sourceFolders: string[] }
  >();
  for (const row of toApply) {
    if (!row.product) continue;
    const hit = grouped.get(row.product.id) ?? {
      product: row.product,
      topCategory: row.topCategory,
      fileSet: new Set<string>(),
      sourceFolders: [],
    };
    for (const filePath of row.imageFiles) hit.fileSet.add(filePath);
    hit.sourceFolders.push(row.relativeFolder);
    grouped.set(row.product.id, hit);
  }

  let updatedProducts = 0;

  for (const entry of grouped.values()) {
    const files = Array.from(entry.fileSet.values());
    const { primary, previews } = await uploadFilesForProduct(
      entry.product,
      entry.topCategory,
      files,
      resolvedBucket
    );
    if (!primary || previews.length === 0) continue;

    await prisma.product.update({
      where: { id: entry.product.id },
      data: {
        image_url: primary,
        preview_images: previews,
      },
    });
    updatedProducts += 1;

    if (VERBOSE) {
      console.log(
        `Updated ${entry.product.product_code} (${entry.product.name}) with ${previews.length} images from ${entry.sourceFolders.length} folder(s).`
      );
    }
  }

  const groups = await prisma.productGroup.findMany({
    where: { is_active: true },
    select: {
      id: true,
      image_url: true,
      products: {
        where: { is_active: true },
        select: { image_url: true, preview_images: true },
        orderBy: { created_at: "asc" },
      },
    },
  });

  let updatedGroups = 0;
  for (const group of groups) {
    const current = group.image_url?.trim() ?? "";
    const hasCurrent = current.length > 0 && (await urlExists(current));
    if (hasCurrent) continue;

    let fallback: string | null = null;
    for (const product of group.products) {
      const primary = product.image_url?.trim() ?? "";
      if (primary.length > 0 && (await urlExists(primary))) {
        fallback = primary;
        break;
      }
      for (const previewUrl of product.preview_images ?? []) {
        if (previewUrl.trim().length > 0 && (await urlExists(previewUrl))) {
          fallback = previewUrl;
          break;
        }
      }
      if (fallback) break;
    }

    if (!fallback) continue;
    await prisma.productGroup.update({
      where: { id: group.id },
      data: { image_url: fallback },
    });
    updatedGroups += 1;
  }

  const categories = await prisma.productCategory.findMany({
    where: { is_active: true },
    select: {
      id: true,
      image_url: true,
      products: {
        where: { is_active: true },
        select: { image_url: true, preview_images: true },
        orderBy: { created_at: "asc" },
      },
    },
  });

  let updatedCategories = 0;
  for (const category of categories) {
    const current = category.image_url?.trim() ?? "";
    const hasCurrent = current.length > 0 && (await urlExists(current));
    if (hasCurrent) continue;

    let fallback: string | null = null;
    for (const product of category.products) {
      const primary = product.image_url?.trim() ?? "";
      if (primary.startsWith("http")) {
        fallback = primary;
        break;
      }
      const preview = (product.preview_images ?? []).find((url) => url.trim().startsWith("http"));
      if (preview) {
        fallback = preview;
        break;
      }
    }

    if (!fallback) continue;
    await prisma.productCategory.update({
      where: { id: category.id },
      data: { image_url: fallback },
    });
    updatedCategories += 1;
  }

  console.log(
    `Apply mode complete. Updated ${updatedProducts} products, ${updatedGroups} groups, and ${updatedCategories} categories.`
  );
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
