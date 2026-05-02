import { NextResponse } from "next/server";
import { cookies } from "next/headers";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8005/api/v1";
const AUTH_TOKEN_COOKIE = "admin-auth-token";

async function getAuthToken() {
  const cookieStore = await cookies();
  return cookieStore.get(AUTH_TOKEN_COOKIE)?.value;
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const token = await getAuthToken();
  if (!token) return NextResponse.json({ message: "Not authenticated." }, { status: 401 });

  const { id } = await params;
  const apiResponse = await fetch(`${API_BASE_URL}/admin/wallet/payment-details/${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });

  const rawBody = await apiResponse.text();
  let data: unknown = null;
  try { data = JSON.parse(rawBody); } catch { data = { message: rawBody || "Unexpected response." }; }
  return NextResponse.json(data, { status: apiResponse.status });
}
