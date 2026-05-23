import { NextRequest } from "next/server";

import { proxyEconomicScenariosRequest } from "../../_lib/economic-scenarios-bff";

type Ctx = { params: Promise<{ path?: string[] }> };

/**
 * Server-only BFF for economic scenarios (Instruction 18.3B).
 * Proxies to core-domain and attaches actor headers from trusted server context — never treats browser actor headers as production auth.
 */
export async function GET(req: NextRequest, ctx: Ctx) {
  const { path } = await ctx.params;
  return proxyEconomicScenariosRequest(req, path ?? []);
}
