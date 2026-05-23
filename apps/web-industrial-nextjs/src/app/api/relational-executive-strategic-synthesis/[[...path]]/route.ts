import type { NextRequest } from "next/server";

import { proxyRelationalExecutiveStrategicSynthesisRequest } from "../../_lib/relational-executive-strategic-synthesis-bff";

type Ctx = { params: Promise<{ path?: string[] }> };

async function handle(req: NextRequest, ctx: Ctx) {
  const { path } = await ctx.params;
  return proxyRelationalExecutiveStrategicSynthesisRequest(req, path ?? []);
}

export const GET = handle;
export const POST = handle;
