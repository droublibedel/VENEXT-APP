import { NextRequest } from "next/server";

import { CORE_HINT, proxyRequest, resolveCoreUpstream } from "../../_lib/proxy-backend";

type Ctx = { params: Promise<{ path?: string[] }> };

export async function GET(req: NextRequest, ctx: Ctx) {
  const { path } = await ctx.params;
  return proxyRequest(req, path, resolveCoreUpstream, CORE_HINT);
}

export async function PATCH(req: NextRequest, ctx: Ctx) {
  const { path } = await ctx.params;
  return proxyRequest(req, path, resolveCoreUpstream, CORE_HINT);
}
