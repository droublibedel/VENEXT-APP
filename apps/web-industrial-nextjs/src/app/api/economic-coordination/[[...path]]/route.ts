import { NextRequest } from "next/server";

import { proxyEconomicCoordinationRequest } from "../../_lib/economic-coordination-bff";

type Ctx = { params: Promise<{ path?: string[] }> };

export async function GET(req: NextRequest, ctx: Ctx) {
  const { path } = await ctx.params;
  return proxyEconomicCoordinationRequest(req, path ?? []);
}
