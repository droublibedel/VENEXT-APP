import type { NextRequest } from "next/server";

import { proxyRelationalExecutiveOrchestrationRequest } from "../../_lib/relational-executive-orchestration-bff";

type Ctx = { params: Promise<{ path?: string[] }> };

async function handle(req: NextRequest, ctx: Ctx) {
  const { path } = await ctx.params;
  return proxyRelationalExecutiveOrchestrationRequest(req, path ?? []);
}

export const GET = handle;
export const POST = handle;
