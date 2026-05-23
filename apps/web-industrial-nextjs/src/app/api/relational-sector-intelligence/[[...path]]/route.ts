import type { NextRequest } from "next/server";

import { proxyRelationalSectorIntelligenceRequest } from "../../_lib/relational-sector-intelligence-bff";

type RouteContext = { params: Promise<{ path?: string[] }> };

async function handle(req: NextRequest, ctx: RouteContext) {
  const { path } = await ctx.params;
  const segments = ["v1", "relational-sector-intelligence", ...(path ?? [])];
  return proxyRelationalSectorIntelligenceRequest(req, segments);
}

export const GET = handle;
export const POST = handle;
