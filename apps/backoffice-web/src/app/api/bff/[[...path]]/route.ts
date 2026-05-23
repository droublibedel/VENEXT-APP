import { NextRequest } from "next/server";

import { proxyRequest } from "../../_lib/proxy-backend";

function resolveBffUpstream(): string | null {
  const raw =
    process.env.COMMERCE_BFF_URL?.trim() ||
    process.env.NEXT_PUBLIC_COMMERCE_BFF_URL?.trim() ||
    "http://127.0.0.1:3210";
  return raw.replace(/\/$/, "");
}

const HINT = "Set COMMERCE_BFF_URL or NEXT_PUBLIC_COMMERCE_BFF_URL (default http://127.0.0.1:3210).";

type Ctx = { params: Promise<{ path?: string[] }> };

async function handle(req: NextRequest, ctx: Ctx) {
  const { path } = await ctx.params;
  return proxyRequest(req, path, resolveBffUpstream, HINT);
}

export const GET = handle;
export const POST = handle;
export const PATCH = handle;
export const PUT = handle;
export const DELETE = handle;
