import { NextResponse } from "next/server";
import { cookies } from "next/headers";

const BACKEND = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8005/api/v1";

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ coupon_id: string }> }
) {
  const store = await cookies();
  const token = store.get("admin-auth-token")?.value;
  if (!token) return NextResponse.json({ message: "Not authenticated." }, { status: 401 });

  const { coupon_id } = await params;
  const res = await fetch(`${BACKEND}/admin/coupons/${coupon_id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  const text = await res.text();
  let data: unknown;
  try { data = text ? JSON.parse(text) : {}; } catch { data = { message: text }; }
  return NextResponse.json(data, { status: res.status });
}
