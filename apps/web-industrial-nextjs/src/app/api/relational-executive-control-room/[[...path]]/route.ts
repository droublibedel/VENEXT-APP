import type { NextRequest } from "next/server";

import { proxyRelationalExecutiveControlRoomRequest } from "../../_lib/relational-executive-control-room-bff";

type Ctx = { params: Promise<{ path?: string[] }> };

async function handle(req: NextRequest, ctx: Ctx) {
  const { path } = await ctx.params;
  return proxyRelationalExecutiveControlRoomRequest(req, path ?? []);
}

export const GET = handle;
export const POST = handle;
