import type { NextRequest } from "next/server";

import { proxyRelationalEconomicSovereigntyRequest } from "../../_lib/relational-economic-sovereignty-bff";

type Ctx = { params: Promise<{ path?: string[] }> };

async function handle(req: NextRequest, ctx: Ctx) {
  const { path } = await ctx.params;
  return proxyRelationalEconomicSovereigntyRequest(req, path ?? []);
}

export const GET = handle;
export const POST = handle;
