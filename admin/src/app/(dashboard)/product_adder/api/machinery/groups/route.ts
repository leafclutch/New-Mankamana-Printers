import { proxy } from "../../_proxy";
import type { NextRequest } from "next/server";

export const GET = () => proxy("/admin/machinery/groups", "GET");

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const groupCode = `MG-${Math.floor(1000 + Math.random() * 9000)}`;
  return proxy("/admin/machinery/groups", "POST", { ...body, group_code: groupCode });
}
