import type { NextRequest } from "next/server";

import { proxyRelationalOperationalRecommendationRequest } from "../../_lib/relational-operational-recommendation-bff";

type RouteContext = { params: Promise<{ path?: string[] }> };

async function handle(req: NextRequest, ctx: RouteContext) {
  const { path } = await ctx.params;
  const segments = ["v1", "relational-operational-recommendation", ...(path ?? [])];
  return proxyRelationalOperationalRecommendationRequest(req, segments);
}

export const GET = handle;
export const POST = handle;
