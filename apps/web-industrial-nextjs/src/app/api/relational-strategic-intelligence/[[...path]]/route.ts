import type { NextRequest } from "next/server";

import { proxyRelationalStrategicIntelligenceRequest } from "../../_lib/relational-strategic-intelligence-bff";

type Ctx = { params: Promise<{ path?: string[] }> };

async function handle(req: NextRequest, ctx: Ctx) {
  const { path } = await ctx.params;
  return proxyRelationalStrategicIntelligenceRequest(req, path ?? []);
}

export const GET = handle;
export const POST = handle;
