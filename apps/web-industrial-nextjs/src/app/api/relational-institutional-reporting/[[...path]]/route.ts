import type { NextRequest } from "next/server";

import { proxyRelationalInstitutionalReportingRequest } from "../../_lib/relational-institutional-reporting-bff";

type Ctx = { params: Promise<{ path?: string[] }> };

async function handle(req: NextRequest, ctx: Ctx) {
  const { path } = await ctx.params;
  return proxyRelationalInstitutionalReportingRequest(req, path ?? []);
}

export const GET = handle;
export const POST = handle;
