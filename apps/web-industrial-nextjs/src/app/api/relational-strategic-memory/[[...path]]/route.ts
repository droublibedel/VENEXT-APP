import type { NextRequest } from "next/server";

import { proxyRelationalStrategicMemoryRequest } from "../../_lib/relational-strategic-memory-bff";

type RouteContext = { params: Promise<{ path?: string[] }> };

async function handle(req: NextRequest, ctx: RouteContext) {
  const { path } = await ctx.params;
  const segments = ["v1", "relational-strategic-memory", ...(path ?? [])];
  return proxyRelationalStrategicMemoryRequest(req, segments);
}

export const GET = handle;
export const POST = handle;
