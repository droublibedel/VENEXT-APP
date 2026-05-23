import type { NextRequest } from "next/server";

import { proxyRelationalExecutiveOperationsRequest } from "../../_lib/relational-executive-operations-bff";

type Ctx = { params: Promise<{ path?: string[] }> };

async function handle(req: NextRequest, ctx: Ctx) {
  const { path } = await ctx.params;
  return proxyRelationalExecutiveOperationsRequest(req, path ?? []);
}

export const GET = handle;
export const POST = handle;
