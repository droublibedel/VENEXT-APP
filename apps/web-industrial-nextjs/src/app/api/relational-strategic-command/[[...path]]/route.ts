import type { NextRequest } from "next/server";

import { proxyRelationalStrategicCommandRequest } from "../../_lib/relational-strategic-command-bff";

type Ctx = { params: Promise<{ path?: string[] }> };

async function handle(req: NextRequest, ctx: Ctx) {
  const { path } = await ctx.params;
  return proxyRelationalStrategicCommandRequest(req, path ?? []);
}

export const GET = handle;
export const POST = handle;
