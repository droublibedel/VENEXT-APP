import type { NextRequest } from "next/server";

import { proxyRelationalOperationalOrchestrationRequest } from "../../_lib/relational-operational-orchestration-bff";

type RouteContext = { params: Promise<{ path?: string[] }> };

async function handle(req: NextRequest, ctx: RouteContext) {
  const { path } = await ctx.params;
  const segments = ["v1", "relational-operational-orchestration", ...(path ?? [])];
  return proxyRelationalOperationalOrchestrationRequest(req, segments);
}

export const GET = handle;
export const POST = handle;
