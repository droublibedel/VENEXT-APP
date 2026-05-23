import type { NextRequest } from "next/server";

import { proxyRelationalMacroObservatoryGovernanceRequest } from "../../_lib/relational-macro-observatory-governance-bff";

type Ctx = { params: Promise<{ path?: string[] }> };

async function handle(req: NextRequest, ctx: Ctx) {
  const { path } = await ctx.params;
  return proxyRelationalMacroObservatoryGovernanceRequest(req, path ?? []);
}

export const GET = handle;
export const POST = handle;
