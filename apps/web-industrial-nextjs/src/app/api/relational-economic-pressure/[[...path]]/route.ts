import type { NextRequest } from "next/server";

import { proxyRelationalEconomicPressureRequest } from "../../_lib/relational-economic-pressure-bff";

type RouteContext = { params: Promise<{ path?: string[] }> };

async function handle(req: NextRequest, ctx: RouteContext) {
  const { path } = await ctx.params;
  const segments = ["v1", "relational-economic-pressure", ...(path ?? [])];
  return proxyRelationalEconomicPressureRequest(req, segments);
}

export const GET = handle;
export const POST = handle;
