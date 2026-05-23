import { NextRequest } from "next/server";

import { proxyIndustrialOperationalContinuityRequest } from "../../_lib/industrial-operational-continuity-bff";

type Ctx = { params: Promise<{ path?: string[] }> };

export async function GET(req: NextRequest, ctx: Ctx) {
  const { path } = await ctx.params;
  return proxyIndustrialOperationalContinuityRequest(req, path ?? []);
}
