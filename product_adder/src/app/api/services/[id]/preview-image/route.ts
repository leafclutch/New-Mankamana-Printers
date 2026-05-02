import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { supabase, BUCKET } from "@/lib/supabase";

type Ctx = { params: Promise<{ id: string }> };

function toStoragePath(publicUrl: string): string | null {
  const marker = `/object/public/${BUCKET}/`;
  const idx = publicUrl.indexOf(marker);
  if (idx < 0) return null;
  return publicUrl.slice(idx + marker.length);
}

export async function POST(req: Request, { params }: Ctx) {
  const { id } = await params;
  const category = await db.productCategory.findUnique({
    where: { id },
    select: { id: true, slug: true, image_url: true },
  });
  if (!category) return NextResponse.json({ error: "Category not found" }, { status: 404 });

  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }
  if (!file.type.startsWith("image/")) {
    return NextResponse.json({ error: "Only image files are allowed" }, { status: 400 });
  }

  const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
  const path = `categories/${category.slug}/preview-${Date.now()}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(path, buffer, { contentType: file.type, upsert: true });

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 });
  }

  const publicUrl = supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
  await db.productCategory.update({
    where: { id: category.id },
    data: { image_url: publicUrl },
  });

  const oldPath = category.image_url ? toStoragePath(category.image_url) : null;
  if (oldPath && oldPath !== path) {
    await supabase.storage.from(BUCKET).remove([oldPath]);
  }

  return NextResponse.json({ id: category.id, image_url: publicUrl });
}
