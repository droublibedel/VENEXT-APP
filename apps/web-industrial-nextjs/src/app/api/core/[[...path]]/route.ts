import { NextRequest } from "next/server";

import { proxyRequest, resolveCoreUpstream } from "../../_lib/proxy-backend";

type Ctx = { params: Promise<{ path?: string[] }> };

const CORE_HINT =
  "Set CORE_DOMAIN_URL or NEXT_PUBLIC_CORE_DOMAIN_URL for /api/core proxy targets.";

export async function GET(req: NextRequest, ctx: Ctx) {
  const { path } = await ctx.params;
  return proxyRequest(req, path, resolveCoreUpstream, CORE_HINT);
}

export async function POST(req: NextRequest, ctx: Ctx) {
  const { path } = await ctx.params;
  return proxyRequest(req, path, resolveCoreUpstream, CORE_HINT);
}

export async function PUT(req: NextRequest, ctx: Ctx) {
  const { path } = await ctx.params;
  return proxyRequest(req, path, resolveCoreUpstream, CORE_HINT);
}

export async function PATCH(req: NextRequest, ctx: Ctx) {
  const { path } = await ctx.params;
  return proxyRequest(req, path, resolveCoreUpstream, CORE_HINT);
}

export async function DELETE(req: NextRequest, ctx: Ctx) {
  const { path } = await ctx.params;
  return proxyRequest(req, path, resolveCoreUpstream, CORE_HINT);
}
