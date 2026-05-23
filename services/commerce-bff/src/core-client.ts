const CORE_BASE = process.env.CORE_DOMAIN_URL ?? "http://127.0.0.1:3200/v1";

export async function fetchCore<T>(
  path: string,
  init?: RequestInit,
): Promise<{ ok: boolean; data: T | null; status: number }> {
  const url = `${CORE_BASE}${path.startsWith("/") ? path : `/${path}`}`;
  try {
    const res = await fetch(url, {
      ...init,
      headers: { "content-type": "application/json", ...(init?.headers ?? {}) },
      signal: AbortSignal.timeout(12_000),
    });
    if (!res.ok) return { ok: false, data: null, status: res.status };
    const data = (await res.json()) as T;
    return { ok: true, data, status: res.status };
  } catch {
    return { ok: false, data: null, status: 502 };
  }
}

export function persistenceEnabled(): boolean {
  if (process.env.VENEXT_BACKEND_PERSISTENCE === "false") return false;
  return process.env.NODE_ENV !== "production" || process.env.VENEXT_BACKEND_PERSISTENCE === "true";
}
