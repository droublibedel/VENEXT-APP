import type { NextRequest } from "next/server";

import { proxyRelationalEconomicMonitoringRequest } from "../../_lib/relational-economic-monitoring-bff";

type Ctx = { params: Promise<{ path?: string[] }> };

async function handle(req: NextRequest, ctx: Ctx) {
  const { path } = await ctx.params;
  return proxyRelationalEconomicMonitoringRequest(req, path ?? []);
}

export const GET = handle;
export const POST = handle;
