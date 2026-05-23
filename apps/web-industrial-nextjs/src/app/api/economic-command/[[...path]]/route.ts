import { NextRequest } from "next/server";

import { proxyEconomicCommandRequest } from "../../_lib/economic-command-bff";

type Ctx = { params: Promise<{ path?: string[] }> };

export async function GET(req: NextRequest, ctx: Ctx) {
  const { path } = await ctx.params;
  return proxyEconomicCommandRequest(req, path ?? []);
}
