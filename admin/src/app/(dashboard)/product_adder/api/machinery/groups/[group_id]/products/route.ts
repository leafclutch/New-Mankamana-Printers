import { proxy } from "../../../../_proxy";
import type { NextRequest } from "next/server";

type Ctx = { params: Promise<{ group_id: string }> };

export async function POST(req: NextRequest, { params }: Ctx) {
  const { group_id } = await params;
  return proxy(`/admin/machinery/groups/${group_id}/products`, "POST", await req.json().catch(() => null));
}
