import { NextRequest } from "next/server";

import { proxyIndustrialEvidenceRequest } from "../../_lib/industrial-evidence-bff";

type Ctx = { params: Promise<{ path?: string[] }> };

export async function GET(req: NextRequest, ctx: Ctx) {
  const { path } = await ctx.params;
  return proxyIndustrialEvidenceRequest(req, path ?? []);
}
