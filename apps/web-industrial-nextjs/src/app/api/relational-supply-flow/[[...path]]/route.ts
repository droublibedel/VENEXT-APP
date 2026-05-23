import type { NextRequest } from "next/server";

import { proxyRelationalSupplyFlowRequest } from "../../_lib/relational-supply-flow-bff";

type RouteContext = { params: Promise<{ path?: string[] }> };

async function handle(req: NextRequest, ctx: RouteContext) {
  const { path } = await ctx.params;
  const segments = ["v1", "relational-supply-flow", ...(path ?? [])];
  return proxyRelationalSupplyFlowRequest(req, segments);
}

export const GET = handle;
export const POST = handle;
