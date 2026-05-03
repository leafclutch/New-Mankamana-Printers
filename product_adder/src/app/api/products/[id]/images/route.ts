import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { supabase, BUCKET } from "@/lib/supabase";

function storagePath(imageUrl: string): string {
  const marker = `/object/public/${BUCKET}/`;
  const idx = imageUrl.indexOf(marker);
  return idx >= 0 ? imageUrl.slice(idx + marker.length) : imageUrl;
}

function isFilePath(path: string): boolean {
  const last = path.split("/").pop() ?? "";
  return /\.[a-z0-9]+$/i.test(last);
}

function folderOf(path: string): string {
  const idx = path.lastIndexOf("/");
  return idx > 0 ? path.slice(0, idx) : path;
}

async function storageFileExists(path: string): Promise<boolean> {
  if (!isFilePath(path)) return false;
  const folder = folderOf(path);
  const filename = path.split("/").pop() ?? "";
  if (!filename) return false;

  const { data, error } = await supabase.storage
    .from(BUCKET)
    .list(folder, { limit: 100, search: filename });

  if (error) return false;
  return (data ?? []).some((entry) => entry.name === filename && Boolean(entry.id));
}

function resolveFolderPath(product: { image_url: string | null; preview_images: string[] }): string | null {
  const firstPreview = product.preview_images?.[0];
  if (firstPreview) return folderOf(storagePath(firstPreview));

  if (product.image_url) {
    const path = storagePath(product.image_url);
    return isFilePath(path) ? folderOf(path) : path;
  }

  return null;
}

// GET /api/products/[id]/images - list all images in the product folder
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const product = await db.product.findUnique({
    where: { id },
    select: { image_url: true, preview_images: true },
  });
  if (!product) return NextResponse.json([]);

  const folder = resolveFolderPath(product);
  if (!folder) return NextResponse.json([]);

  const { data, error } = await supabase.storage.from(BUCKET).list(folder, { limit: 200 });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const files = (data ?? []).filter((f) => f.name !== ".keep");
  const urls = files.map((f) => ({
    name: f.name,
    url: supabase.storage.from(BUCKET).getPublicUrl(`${folder}/${f.name}`).data.publicUrl,
    path: `${folder}/${f.name}`,
  }));
  return NextResponse.json(urls);
}

// POST /api/products/[id]/images - upload one image (multipart/form-data, field: "file")
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const product = await db.product.findUnique({
    where: { id },
    select: { id: true, image_url: true, preview_images: true },
  });
  if (!product) return NextResponse.json({ error: "Product not found" }, { status: 404 });

  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "No file provided" }, { status: 400 });

  const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
  const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}.${ext}`;
  const folder = resolveFolderPath(product) ?? `products/${product.id}/images`;
  const filePath = `${folder}/${filename}`;

  const buffer = Buffer.from(await file.arrayBuffer());
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(filePath, buffer, { contentType: file.type, upsert: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const publicUrl = supabase.storage.from(BUCKET).getPublicUrl(filePath).data.publicUrl;
  const currentPath = product.image_url ? storagePath(product.image_url) : "";
  const imageUrlLooksLikeFile = currentPath ? isFilePath(currentPath) : false;
  const imageUrlExists = imageUrlLooksLikeFile ? await storageFileExists(currentPath) : false;
  const shouldSetPrimary =
    !product.image_url ||
    !imageUrlLooksLikeFile ||
    !imageUrlExists ||
    (product.preview_images?.length ?? 0) === 0;

  await db.product.update({
    where: { id },
    data: {
      preview_images: { push: publicUrl },
      ...(shouldSetPrimary ? { image_url: publicUrl } : {}),
    },
  });

  return NextResponse.json({ url: publicUrl, path: filePath, name: filename }, { status: 201 });
}

// DELETE /api/products/[id]/images - delete one image by path (body: { path })
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { path } = await req.json();
  if (!path) return NextResponse.json({ error: "path required" }, { status: 400 });

  const { error } = await supabase.storage.from(BUCKET).remove([path]);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const product = await db.product.findUnique({
    where: { id },
    select: { image_url: true, preview_images: true },
  });
  if (product) {
    const publicUrl = supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
    const nextPreviewImages = product.preview_images.filter((u) => u !== publicUrl);
    const nextPrimaryImage = product.image_url === publicUrl ? (nextPreviewImages[0] ?? null) : product.image_url;
    await db.product.update({
      where: { id },
      data: {
        preview_images: nextPreviewImages,
        image_url: nextPrimaryImage,
      },
    });
  }

  return NextResponse.json({ ok: true });
}
