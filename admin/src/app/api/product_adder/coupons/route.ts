import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

const BACKEND = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8005/api/v1";

async function authHeader() {
  const store = await cookies();
  const token = store.get("admin-auth-token")?.value;
  if (!token) return null;
  return { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
}

function toJson(res: Response) {
  return res.text().then((text) => {
    let data: unknown;
    try { data = text ? JSON.parse(text) : {}; } catch { data = { message: text }; }
    return NextResponse.json(data, { status: res.status });
  });
}

export async function GET() {
  const headers = await authHeader();
  if (!headers) return NextResponse.json({ message: "Not authenticated." }, { status: 401 });
  return toJson(await fetch(`${BACKEND}/admin/coupons`, { method: "GET", headers, cache: "no-store" }));
}

export async function POST(req: NextRequest) {
  const headers = await authHeader();
  if (!headers) return NextResponse.json({ message: "Not authenticated." }, { status: 401 });
  const body = await req.json();
  return toJson(await fetch(`${BACKEND}/admin/coupons`, { method: "POST", headers, body: JSON.stringify(body) }));
}
