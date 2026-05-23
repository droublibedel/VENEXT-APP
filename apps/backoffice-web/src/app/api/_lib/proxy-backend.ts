import { NextRequest } from "next/server";

function stripTrailingSlash(s: string) {
  return s.replace(/\/$/, "");
}

export function resolveCoreUpstream(): string | null {
  const raw =
    process.env.CORE_DOMAIN_URL?.trim() ||
    process.env.NEXT_PUBLIC_CORE_DOMAIN_URL?.trim() ||
    "";
  return raw ? stripTrailingSlash(raw) : null;
}

function buildTarget(base: string, pathSegments: string[] | undefined, search: string) {
  const suffix = pathSegments && pathSegments.length > 0 ? `/${pathSegments.join("/")}` : "";
  return `${base}${suffix}${search}`;
}

function forwardRequestHeaders(req: NextRequest): Headers {
  const h = new Headers();
  const pass = [
    "authorization",
    "x-correlation-id",
    "x-venext-backoffice-token",
    "x-venext-user-id",
    "x-venext-user-role",
    "x-venext-acting-organization-id",
  ] as const;
  for (const k of pass) {
    const v = req.headers.get(k);
    if (v) h.set(k, v);
  }
  return h;
}

const CORE_HINT =
  "Set CORE_DOMAIN_URL or NEXT_PUBLIC_CORE_DOMAIN_URL for /api/core proxy targets.";

export async function proxyRequest(
  req: NextRequest,
  pathSegments: string[] | undefined,
  resolveBase: () => string | null,
  configHint: string,
): Promise<Response> {
  const base = resolveBase();
  const search = req.nextUrl.search;
  if (!base) {
    return Response.json(
      {
        error: "Upstream not configured",
        hint: configHint,
        degraded: true,
      },
      { status: 503 },
    );
  }
  const target = buildTarget(base, pathSegments, search);
  const method = req.method.toUpperCase();
  const headers = forwardRequestHeaders(req);
  if (method !== "GET" && method !== "HEAD") {
    const ct = req.headers.get("content-type");
    if (ct) headers.set("content-type", ct);
  }
  const init: RequestInit = {
    method,
    headers,
    signal: AbortSignal.timeout(60_000),
  };
  if (method !== "GET" && method !== "HEAD") {
    init.body = await req.arrayBuffer();
  }
  const upstream = await fetch(target, init);
  const out = new Headers();
  const uct = upstream.headers.get("content-type");
  if (uct) out.set("content-type", uct);
  const cl = upstream.headers.get("content-length");
  if (cl) out.set("content-length", cl);
  return new Response(upstream.body, { status: upstream.status, headers: out });
}

export { CORE_HINT };
