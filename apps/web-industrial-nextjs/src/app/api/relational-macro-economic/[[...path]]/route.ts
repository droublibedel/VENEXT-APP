import type { NextRequest } from "next/server";

import { proxyRelationalMacroEconomicRequest } from "../../_lib/relational-macro-economic-bff";

type RouteContext = { params: Promise<{ path?: string[] }> };

async function handle(req: NextRequest, ctx: RouteContext) {
  const { path } = await ctx.params;
  const segments = ["v1", "relational-macro-economic", ...(path ?? [])];
  return proxyRelationalMacroEconomicRequest(req, segments);
}

export const GET = handle;
export const POST = handle;
