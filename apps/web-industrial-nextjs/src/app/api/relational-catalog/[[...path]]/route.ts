import { NextRequest } from "next/server";

import { proxyRelationalCatalogRequest } from "../../_lib/relational-catalog-bff";

type Ctx = { params: Promise<{ path?: string[] }> };

export async function GET(req: NextRequest, ctx: Ctx) {
  const { path } = await ctx.params;
  return proxyRelationalCatalogRequest(req, path ?? []);
}
