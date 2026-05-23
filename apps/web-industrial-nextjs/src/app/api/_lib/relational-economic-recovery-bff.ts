import type { NextRequest } from "next/server";

import { buildRelationalOrdersUpstreamHeaders } from "./relational-orders-bff";
import { resolveCoreUpstream } from "./proxy-backend";

const CORE_HINT =
  "Set CORE_DOMAIN_URL or NEXT_PUBLIC_CORE_DOMAIN_URL for /api/relational-economic-recovery proxy targets.";

export async function proxyRelationalEconomicRecoveryRequest(
  req: NextRequest,
  pathSegments: string[],
): Promise<Response> {
  const base = resolveCoreUpstream();
  if (!base) {
    return Response.json({ error: "Upstream not configured", hint: CORE_HINT }, { status: 503 });
  }
  const headersOrErr = buildRelationalOrdersUpstreamHeaders(req);
  if (headersOrErr instanceof Response) return headersOrErr;

  const suffix = pathSegments.length > 0 ? `/${pathSegments.join("/")}` : "";
  const target = `${base}${suffix}${req.nextUrl.search}`;
  const upstream = await fetch(target, {
    method: req.method,
    headers: headersOrErr,
    body: req.method === "GET" || req.method === "HEAD" ? undefined : await req.text(),
    signal: AbortSignal.timeout(60_000),
    cache: "no-store",
  });
  const out = new Headers();
  const uct = upstream.headers.get("content-type");
  if (uct) out.set("content-type", uct);
  return new Response(upstream.body, { status: upstream.status, headers: out });
}
