import type { NextRequest } from "next/server";

import { proxyRelationalEconomicStabilizationRequest } from "../../_lib/relational-economic-stabilization-bff";

type Ctx = { params: Promise<{ path?: string[] }> };

async function handle(req: NextRequest, ctx: Ctx) {
  const { path } = await ctx.params;
  return proxyRelationalEconomicStabilizationRequest(req, path ?? []);
}

export const GET = handle;
export const POST = handle;
