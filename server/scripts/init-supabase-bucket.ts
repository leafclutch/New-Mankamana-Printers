/**
 * init-supabase-bucket.ts
 * ---------------------------------------------------------------------------
 * Creates all required Supabase Storage buckets and seeds folder placeholders.
 *
 * Usage (from server/):
 *   npm run bucket:init
 *
 * Safe to re-run — skips existing buckets and files.
 *
 * Buckets created:
 *   product-assets   (public)  — product thumbnails + variant carousel images
 *   designs          (private) — design submissions + approved files
 *   payment-proofs   (private) — order payment proof uploads
 *   banners          (public)  — website banner/marketing images
 * ---------------------------------------------------------------------------
 */

import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

interface BucketConfig {
  name: string;
  public: boolean;
  folders: string[]; // paths of .keep placeholder files
}

const BUCKETS: BucketConfig[] = [
  {
    name: "product-assets",
    public: true,
    folders: [
      // Each product gets its own folder. Seed a generic placeholder.
      // Real product folders are created when you upload the first image.
      // Naming: product-assets/{product_slug}/thumbnail.webp
      //         product-assets/{product_slug}/variants/{variant_code}.webp
      "_readme/.keep", // documents naming convention
    ],
  },
  {
    // templates are public — displayed in the template library for all clients to browse
    name: "design-templates",
    public: true,
    folders: [
      // Organised by product so the template library can filter by product
      // Naming: design-templates/{product_slug}/{template_code}.webp
      "_readme/.keep",
    ],
  },
  {
    // submissions + approved are private — client artwork / IP
    name: "design-files",
    public: false,
    folders: [
      "submissions/.keep", // client uploads awaiting admin review
      "approved/.keep",    // files linked to approved design codes (serve via signed URL)
    ],
  },
  {
    name: "payment-proofs",
    public: false,
    folders: [
      ".keep", // flat folder — files named by UUID: {uuid}.{ext}
    ],
  },
  {
    name: "banners",
    public: true,
    folders: [
      "home/.keep",  // homepage hero/promo banners
      "misc/.keep",  // other marketing images
    ],
  },
];

const ALLOWED_MIME_TYPES = [
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
  "application/pdf",
];

async function ensureBucket(cfg: BucketConfig) {
  const { data: existing } = await supabase.storage.getBucket(cfg.name);

  if (!existing) {
    const { error } = await supabase.storage.createBucket(cfg.name, {
      public: cfg.public,
      allowedMimeTypes: ALLOWED_MIME_TYPES,
      fileSizeLimit: 10 * 1024 * 1024, // 10 MB
    });
    if (error) {
      console.error(`  ❌  Failed to create bucket "${cfg.name}": ${error.message}`);
      return false;
    }
    console.log(`  ✅  Created bucket "${cfg.name}" (${cfg.public ? "public" : "private"})`);
  } else {
    console.log(`  ⏭️  Bucket "${cfg.name}" already exists — skipping`);
  }
  return true;
}

async function ensureFolders(bucketName: string, folders: string[]) {
  let created = 0;
  let skipped = 0;

  for (const filePath of folders) {
    const dir = filePath.includes("/")
      ? filePath.substring(0, filePath.lastIndexOf("/"))
      : "";

    const { data: existing } = await supabase.storage
      .from(bucketName)
      .list(dir, { search: ".png" });

    if (existing && existing.length > 0) {
      console.log(`     ⏭️  skip  ${bucketName}/${filePath}`);
      skipped++;
      continue;
    }

    // Minimal 1×1 transparent PNG — used as folder placeholder
    // (buckets only allow image/PDF types, so text/plain is rejected)
    const PLACEHOLDER_PNG = Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAC0lEQVQI12NgAAIABQ" +
      "AABjkB6QAAAABJRU5ErkJggg==",
      "base64",
    );

    const { error } = await supabase.storage
      .from(bucketName)
      .upload(filePath.replace(".keep", ".png"), PLACEHOLDER_PNG, {
        contentType: "image/png",
        upsert: false,
      });

    if (error && !error.message.includes("already exists")) {
      console.error(`     ❌  ${bucketName}/${filePath}: ${error.message}`);
    } else {
      console.log(`     ✅  ${bucketName}/${filePath.replace(".keep", ".png")}`);
      created++;
    }
  }

  return { created, skipped };
}

async function run() {
  console.log("\n🪣  Initialising Supabase Storage buckets\n");
  console.log("=".repeat(50));

  let totalCreated = 0;
  let totalSkipped = 0;

  for (const cfg of BUCKETS) {
    console.log(`\n📦  ${cfg.name}`);
    const ok = await ensureBucket(cfg);
    if (!ok) continue;

    const { created, skipped } = await ensureFolders(cfg.name, cfg.folders);
    totalCreated += created;
    totalSkipped += skipped;
  }

  const base = `${process.env.SUPABASE_URL}/storage/v1/object/public`;

  console.log("\n" + "=".repeat(50));
  console.log(`✅  Done. Folders created: ${totalCreated}  Skipped: ${totalSkipped}`);

  console.log(`
📁  Naming Conventions
${"─".repeat(50)}
product-assets/{product_slug}/thumbnail.webp
    e.g. product-assets/card-holders/thumbnail.webp

product-assets/{product_slug}/variants/{variant_code}.webp
    e.g. product-assets/card-holders/variants/black-leather.webp
    e.g. product-assets/card-holders/variants/brown-leather.webp

design-templates/{product_slug}/{template_code}.webp   ← admin uploads
    e.g. design-templates/card-holders/minimal-dark.webp
    (public bucket — used in template library browsing)

design-files/submissions/{uuid}.{ext}   ← auto-managed by server (private)
design-files/approved/{uuid}.{ext}      ← auto-managed by server (private, signed URLs)

payment-proofs/{uuid}.{ext}             ← auto-managed by server (private, signed URLs)

banners/home/{filename}.webp
banners/misc/{filename}.webp

${"─".repeat(50)}
Public base URLs (product-assets, design-templates, banners):
  ${base}/product-assets/
  ${base}/design-templates/
  ${base}/banners/

Private buckets (design-files, payment-proofs):
  Always serve via signed URL — never expose service role key to client
`);
}

run().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
