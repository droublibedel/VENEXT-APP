import type { NextRequest } from "next/server";

import { proxyRelationalPredictiveRiskRequest } from "../../_lib/relational-predictive-risk-bff";

type Ctx = { params: Promise<{ path?: string[] }> };

async function handle(req: NextRequest, ctx: Ctx) {
  const { path } = await ctx.params;
  const segments = ["v1", "relational-predictive-risk", ...(path ?? [])];
  return proxyRelationalPredictiveRiskRequest(req, segments);
}

export const GET = handle;
export const POST = handle;
