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

export async function DELETE(_: Request, { params }: Ctx) {
  const { id } = await params;
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const template = await db.template.findUnique({
    where: { id },
    select: { id: true, fileUrl: true, isActive: true },
  });
  if (!template || !template.isActive) {
    return NextResponse.json({ error: "Template not found" }, { status: 404 });
  }

  const storagePath = toStoragePath(template.fileUrl);
  if (storagePath) {
    await supabase.storage.from(BUCKET).remove([storagePath]);
  }

  await db.template.update({
    where: { id },
    data: { isActive: false },
  });

  return NextResponse.json({ ok: true });
}
