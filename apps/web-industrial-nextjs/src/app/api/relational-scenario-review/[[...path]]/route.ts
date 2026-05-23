import type { NextRequest } from "next/server";

import { proxyRelationalScenarioReviewRequest } from "../../_lib/relational-scenario-review-bff";

type RouteContext = { params: Promise<{ path?: string[] }> };

async function handle(req: NextRequest, ctx: RouteContext) {
  const { path } = await ctx.params;
  const segments = ["v1", "relational-scenario-review", ...(path ?? [])];
  return proxyRelationalScenarioReviewRequest(req, segments);
}

export const GET = handle;
export const POST = handle;
