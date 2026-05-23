import type { NextRequest } from "next/server";

import { proxyRelationalEconomicGovernanceRequest } from "../../_lib/relational-economic-governance-bff";

type Ctx = { params: Promise<{ path?: string[] }> };

async function handle(req: NextRequest, ctx: Ctx) {
  const { path } = await ctx.params;
  return proxyRelationalEconomicGovernanceRequest(req, path ?? []);
}

export const GET = handle;
export const POST = handle;
