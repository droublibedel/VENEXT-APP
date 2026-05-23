import type { NextRequest } from "next/server";

import { proxyRelationalEconomicSignalGraphRequest } from "../../_lib/relational-economic-signal-graph-bff";

type RouteContext = { params: Promise<{ path?: string[] }> };

async function handle(req: NextRequest, ctx: RouteContext) {
  const { path } = await ctx.params;
  const segments = ["v1", "relational-economic-signal-graph", ...(path ?? [])];
  return proxyRelationalEconomicSignalGraphRequest(req, segments);
}

export const GET = handle;
export const POST = handle;
