import type { NextRequest } from "next/server";

import { proxyRelationalStrategicObservatoryRequest } from "../../_lib/relational-strategic-observatory-bff";

type Ctx = { params: Promise<{ path?: string[] }> };

async function handle(req: NextRequest, ctx: Ctx) {
  const { path } = await ctx.params;
  return proxyRelationalStrategicObservatoryRequest(req, path ?? []);
}

export const GET = handle;
export const POST = handle;
