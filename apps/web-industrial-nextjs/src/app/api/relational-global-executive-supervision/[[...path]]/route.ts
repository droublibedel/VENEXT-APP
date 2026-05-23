import type { NextRequest } from "next/server";

import { proxyRelationalGlobalExecutiveSupervisionRequest } from "../../_lib/relational-global-executive-supervision-bff";

type Ctx = { params: Promise<{ path?: string[] }> };

async function handle(req: NextRequest, ctx: Ctx) {
  const { path } = await ctx.params;
  return proxyRelationalGlobalExecutiveSupervisionRequest(req, path ?? []);
}

export const GET = handle;
export const POST = handle;
