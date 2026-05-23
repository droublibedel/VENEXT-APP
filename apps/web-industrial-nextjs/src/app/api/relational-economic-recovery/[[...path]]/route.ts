import type { NextRequest } from "next/server";

import { proxyRelationalEconomicRecoveryRequest } from "../../_lib/relational-economic-recovery-bff";

type Ctx = { params: Promise<{ path?: string[] }> };

async function handle(req: NextRequest, ctx: Ctx) {
  const { path } = await ctx.params;
  return proxyRelationalEconomicRecoveryRequest(req, path ?? []);
}

export const GET = handle;
export const POST = handle;
