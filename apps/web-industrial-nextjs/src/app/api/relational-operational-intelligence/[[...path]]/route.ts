import type { NextRequest } from "next/server";

import { proxyRelationalOperationalIntelligenceRequest } from "../../_lib/relational-operational-intelligence-bff";

type Ctx = { params: Promise<{ path?: string[] }> };

async function handle(req: NextRequest, ctx: Ctx) {
  const { path } = await ctx.params;
  const segments = ["v1", "relational-operational-intelligence", ...(path ?? [])];
  return proxyRelationalOperationalIntelligenceRequest(req, segments);
}

export const GET = handle;
export const POST = handle;
