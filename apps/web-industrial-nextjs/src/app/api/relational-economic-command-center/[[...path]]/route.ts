import type { NextRequest } from "next/server";

import { proxyRelationalEconomicCommandCenterRequest } from "../../_lib/relational-economic-command-center-bff";

type RouteContext = { params: Promise<{ path?: string[] }> };

async function handle(req: NextRequest, ctx: RouteContext) {
  const { path } = await ctx.params;
  const segments = ["v1", "relational-economic-command-center", ...(path ?? [])];
  return proxyRelationalEconomicCommandCenterRequest(req, segments);
}

export const GET = handle;
export const POST = handle;
