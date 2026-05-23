import type { NextRequest } from "next/server";

import { proxyRelationalGeoEconomicRequest } from "../../_lib/relational-geo-economic-bff";

type RouteContext = { params: Promise<{ path?: string[] }> };

async function handle(req: NextRequest, ctx: RouteContext) {
  const { path } = await ctx.params;
  const segments = ["v1", "relational-geo-economic", ...(path ?? [])];
  return proxyRelationalGeoEconomicRequest(req, segments);
}

export const GET = handle;
export const POST = handle;
