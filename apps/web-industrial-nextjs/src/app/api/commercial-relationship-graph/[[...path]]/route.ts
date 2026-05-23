import { NextRequest } from "next/server";

import { proxyCommercialRelationshipGraphRequest } from "../../_lib/commercial-relationship-graph-bff";

type Ctx = { params: Promise<{ path?: string[] }> };

export async function GET(req: NextRequest, ctx: Ctx) {
  const { path } = await ctx.params;
  return proxyCommercialRelationshipGraphRequest(req, path ?? []);
}
