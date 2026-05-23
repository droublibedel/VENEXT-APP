import { NextRequest } from "next/server";

import { proxyRelationalOrdersRequest } from "../../_lib/relational-orders-bff";

type Ctx = { params: Promise<{ path?: string[] }> };

export async function GET(req: NextRequest, ctx: Ctx) {
  const { path } = await ctx.params;
  return proxyRelationalOrdersRequest(req, path ?? []);
}
