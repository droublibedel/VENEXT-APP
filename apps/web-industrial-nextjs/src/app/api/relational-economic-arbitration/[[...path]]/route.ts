import type { NextRequest } from "next/server";

import { proxyRelationalEconomicArbitrationRequest } from "../../_lib/relational-economic-arbitration-bff";

type Ctx = { params: Promise<{ path?: string[] }> };

async function handle(req: NextRequest, ctx: Ctx) {
  const { path } = await ctx.params;
  return proxyRelationalEconomicArbitrationRequest(req, path ?? []);
}

export const GET = handle;
export const POST = handle;
