import { NextRequest } from "next/server";

import { proxyRelationalOrderExecutionRequest } from "../../_lib/relational-order-execution-bff";

type Ctx = { params: Promise<{ path?: string[] }> };

export async function GET(req: NextRequest, ctx: Ctx) {
  const { path } = await ctx.params;
  return proxyRelationalOrderExecutionRequest(req, path ?? []);
}

export async function POST(req: NextRequest, ctx: Ctx) {
  const { path } = await ctx.params;
  return proxyRelationalOrderExecutionRequest(req, path ?? []);
}
