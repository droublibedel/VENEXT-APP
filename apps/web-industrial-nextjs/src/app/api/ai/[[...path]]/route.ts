import { NextRequest } from "next/server";

import { proxyRequest, resolveAiUpstream } from "../../_lib/proxy-backend";

type Ctx = { params: Promise<{ path?: string[] }> };

const AI_HINT =
  "Set AI_GATEWAY_URL or NEXT_PUBLIC_AI_GATEWAY_URL for /api/ai proxy targets.";

export async function GET(req: NextRequest, ctx: Ctx) {
  const { path } = await ctx.params;
  return proxyRequest(req, path, resolveAiUpstream, AI_HINT);
}

export async function POST(req: NextRequest, ctx: Ctx) {
  const { path } = await ctx.params;
  return proxyRequest(req, path, resolveAiUpstream, AI_HINT);
}

export async function PUT(req: NextRequest, ctx: Ctx) {
  const { path } = await ctx.params;
  return proxyRequest(req, path, resolveAiUpstream, AI_HINT);
}

export async function PATCH(req: NextRequest, ctx: Ctx) {
  const { path } = await ctx.params;
  return proxyRequest(req, path, resolveAiUpstream, AI_HINT);
}

export async function DELETE(req: NextRequest, ctx: Ctx) {
  const { path } = await ctx.params;
  return proxyRequest(req, path, resolveAiUpstream, AI_HINT);
}
