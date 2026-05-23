import type { NextRequest } from "next/server";

import { proxyRelationalEconomicContinuityRequest } from "../../_lib/relational-economic-continuity-bff";

type Ctx = { params: Promise<{ path?: string[] }> };

async function handle(req: NextRequest, ctx: Ctx) {
  const { path } = await ctx.params;
  return proxyRelationalEconomicContinuityRequest(req, path ?? []);
}

export const GET = handle;
export const POST = handle;
