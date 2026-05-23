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

export function resolveAiUpstream(): string | null {
  const raw =
    process.env.AI_GATEWAY_URL?.trim() ||
    process.env.NEXT_PUBLIC_AI_GATEWAY_URL?.trim() ||
    "";
  return raw ? stripTrailingSlash(raw) : null;
}

function buildTarget(base: string, pathSegments: string[] | undefined, search: string) {
  const suffix =
    pathSegments && pathSegments.length > 0 ? `/${pathSegments.join("/")}` : "";
  return `${base}${suffix}${search}`;
}

function forwardRequestHeaders(req: NextRequest): Headers {
  const h = new Headers();
  const auth = req.headers.get("authorization");
  if (auth) h.set("authorization", auth);
  const corr = req.headers.get("x-correlation-id");
  if (corr) h.set("x-correlation-id", corr);
  const uid = req.headers.get("x-venext-user-id");
  if (uid) h.set("x-venext-user-id", uid);
  const oid = req.headers.get("x-venext-acting-organization-id");
  if (oid) h.set("x-venext-acting-organization-id", oid);
  return h;
}

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
