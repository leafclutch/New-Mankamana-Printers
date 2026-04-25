import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { supabase, BUCKET } from "@/lib/supabase";

// Derive the storage folder path from the stored public URL
function storagePath(imageUrl: string): string {
  // publicUrl format: {SUPABASE_URL}/storage/v1/object/public/{BUCKET}/{path}
  const marker = `/object/public/${BUCKET}/`;
  const idx = imageUrl.indexOf(marker);
  return idx >= 0 ? imageUrl.slice(idx + marker.length) : imageUrl;
}

// GET /api/products/[id]/images — list all images in the product folder
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const product = await db.product.findUnique({ where: { id }, select: { image_url: true } });
  if (!product?.image_url) return NextResponse.json([]);

  const folder = storagePath(product.image_url);
  const { data, error } = await supabase.storage.from(BUCKET).list(folder, { limit: 200 });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const files = (data ?? []).filter(f => f.name !== ".keep");
  const urls = files.map(f => ({
    name: f.name,
    url: supabase.storage.from(BUCKET).getPublicUrl(`${folder}/${f.name}`).data.publicUrl,
    path: `${folder}/${f.name}`,
  }));
  return NextResponse.json(urls);
}

// POST /api/products/[id]/images — upload one image (multipart/form-data, field: "file")
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const product = await db.product.findUnique({ where: { id }, select: { image_url: true, preview_images: true } });
  if (!product?.image_url) return NextResponse.json({ error: "Product has no image folder" }, { status: 400 });

  const form = await req.formData();
  const file = form.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });

  const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
  const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}.${ext}`;
  const folder = storagePath(product.image_url);
  const filePath = `${folder}/${filename}`;

  const buffer = Buffer.from(await file.arrayBuffer());
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(filePath, buffer, { contentType: file.type, upsert: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(filePath);
  const publicUrl = urlData.publicUrl;

  // append to preview_images
  await db.product.update({
    where: { id },
    data: { preview_images: { push: publicUrl } },
  });

  return NextResponse.json({ url: publicUrl, path: filePath, name: filename }, { status: 201 });
}

// DELETE /api/products/[id]/images — delete one image by path (body: { path })
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { path } = await req.json();
  if (!path) return NextResponse.json({ error: "path required" }, { status: 400 });

  const { error } = await supabase.storage.from(BUCKET).remove([path]);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // remove from preview_images
  const product = await db.product.findUnique({ where: { id }, select: { preview_images: true } });
  if (product) {
    const publicUrl = supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
    await db.product.update({
      where: { id },
      data: { preview_images: product.preview_images.filter(u => u !== publicUrl) },
    });
  }

  return NextResponse.json({ ok: true });
}
