import { NextRequest } from "next/server";

import { proxyIndustrialSituationRoomRequest } from "../../_lib/industrial-situation-room-bff";

type Ctx = { params: Promise<{ path?: string[] }> };

export async function GET(req: NextRequest, ctx: Ctx) {
  const { path } = await ctx.params;
  return proxyIndustrialSituationRoomRequest(req, path ?? []);
}
