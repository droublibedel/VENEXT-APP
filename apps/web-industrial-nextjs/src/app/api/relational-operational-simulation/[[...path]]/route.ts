import type { NextRequest } from "next/server";

import { proxyRelationalOperationalSimulationRequest } from "../../_lib/relational-operational-simulation-bff";

type RouteContext = { params: Promise<{ path?: string[] }> };

async function handle(req: NextRequest, ctx: RouteContext) {
  const { path } = await ctx.params;
  const segments = ["v1", "relational-operational-simulation", ...(path ?? [])];
  return proxyRelationalOperationalSimulationRequest(req, segments);
}

export const GET = handle;
export const POST = handle;
