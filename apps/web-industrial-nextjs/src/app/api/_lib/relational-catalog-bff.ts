import type { NextRequest } from "next/server";

import { resolveCoreUpstream } from "./proxy-backend";

export function isRelationalCatalogDemoMode(env: NodeJS.ProcessEnv = process.env): boolean {
  return (
    env.NEXT_PUBLIC_DEMO_MODE === "true" ||
    env.NEXT_PUBLIC_DEMO_MODE === "1" ||
    env.VENEXT_DEMO_MODE === "true" ||
    env.VENEXT_DEMO_MODE === "1"
  );
}

export function buildRelationalCatalogUpstreamHeaders(req: NextRequest): Headers | Response {
  const h = new Headers();
  const corr = req.headers.get("x-correlation-id");
  if (corr) h.set("x-correlation-id", corr);
  const orgQ = req.nextUrl.searchParams.get("organizationId");

  if (isRelationalCatalogDemoMode()) {
    h.set("x-venext-demo-actor", "true");
    h.set("x-venext-user-id", "browser_demo_unauthenticated");
    if (orgQ) h.set("x-venext-acting-organization-id", orgQ);
    return h;
  }

  const auth = req.headers.get("authorization");
  if (auth?.trim()) {
    h.set("authorization", auth.trim());
    if (orgQ) h.set("x-venext-acting-organization-id", orgQ);
    return h;
  }

  const serverUser = process.env.VENEXT_SERVER_ACTOR_USER_ID?.trim();
  const serverOrg = process.env.VENEXT_SERVER_ACTOR_ORG_ID?.trim();
  if (serverUser && serverOrg) {
    h.set("x-venext-user-id", serverUser);
    h.set("x-venext-acting-organization-id", serverOrg);
    return h;
  }

  return Response.json(
    {
      code: "relational_catalog_bff_actor_required",
      message:
        "Relational catalog BFF requires Authorization, VENEXT_SERVER_ACTOR_USER_ID + VENEXT_SERVER_ACTOR_ORG_ID, or demo mode.",
    },
    { status: 403 },
  );
}

const CORE_HINT =
  "Set CORE_DOMAIN_URL or NEXT_PUBLIC_CORE_DOMAIN_URL for /api/relational-catalog proxy targets.";

export async function proxyRelationalCatalogRequest(req: NextRequest, pathSegments: string[]): Promise<Response> {
  const base = resolveCoreUpstream();
  if (!base) {
    return Response.json({ error: "Upstream not configured", hint: CORE_HINT }, { status: 503 });
  }
  const headersOrErr = buildRelationalCatalogUpstreamHeaders(req);
  if (headersOrErr instanceof Response) return headersOrErr;

  const suffix = pathSegments.length > 0 ? `/${pathSegments.join("/")}` : "";
  const target = `${base}${suffix}${req.nextUrl.search}`;
  const upstream = await fetch(target, {
    method: "GET",
    headers: headersOrErr,
    signal: AbortSignal.timeout(60_000),
    cache: "no-store",
  });
  const out = new Headers();
  const uct = upstream.headers.get("content-type");
  if (uct) out.set("content-type", uct);
  const cl = upstream.headers.get("content-length");
  if (cl) out.set("content-length", cl);
  return new Response(upstream.body, { status: upstream.status, headers: out });
}
