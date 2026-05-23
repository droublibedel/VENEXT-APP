import type { NextRequest } from "next/server";

import { proxyRelationalFulfillmentRequest } from "../../_lib/relational-fulfillment-bff";

type Ctx = { params: Promise<{ path?: string[] }> };

async function handle(req: NextRequest, ctx: Ctx) {
  const { path } = await ctx.params;
  return proxyRelationalFulfillmentRequest(req, path ?? []);
}

export const GET = handle;
export const POST = handle;
export const PUT = handle;
export const PATCH = handle;
export const DELETE = handle;
