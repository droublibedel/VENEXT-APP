/** Governance API client — token rules (Instruction 10A §18). */

export function getGovernanceToken(): string {
  const t = process.env.NEXT_PUBLIC_VENEXT_BACKOFFICE_TOKEN?.trim();
  if (process.env.NODE_ENV === "production") {
    return t ?? "";
  }
  return t ?? "dev-backoffice-token";
}

export function productionTokenMissing(): boolean {
  return process.env.NODE_ENV === "production" && !process.env.NEXT_PUBLIC_VENEXT_BACKOFFICE_TOKEN?.trim();
}

export function governanceHeaders(): HeadersInit {
  const token = getGovernanceToken();
  const h: Record<string, string> = {
    "x-venext-user-id": "backoffice_web_operator",
  };
  if (token) {
    h["x-venext-backoffice-token"] = token;
  }
  return h;
}

export async function fetchGovernanceJson<T>(
  path: string,
  init?: RequestInit,
): Promise<{ ok: boolean; data: T | null; status: number; degraded?: boolean }> {
  const url = `/api/core/v1/backoffice${path}`;
  try {
    const r = await fetch(url, {
      ...init,
      headers: { ...governanceHeaders(), ...(init?.headers ?? {}) },
      cache: "no-store",
    });
    if (r.status === 503) {
      const j = (await r.json().catch(() => null)) as { degraded?: boolean } | null;
      return { ok: false, data: null, status: 503, degraded: Boolean(j?.degraded) };
    }
    const data = (await r.json().catch(() => null)) as T | null;
    return { ok: r.ok, data, status: r.status };
  } catch {
    return { ok: false, data: null, status: 0, degraded: true };
  }
}

export async function patchGovernanceJson<T>(
  path: string,
  body: unknown,
): Promise<{ ok: boolean; data: T | null; status: number; degraded?: boolean }> {
  const url = `/api/core/v1/backoffice${path}`;
  try {
    const r = await fetch(url, {
      method: "PATCH",
      headers: {
        ...governanceHeaders(),
        "content-type": "application/json",
      },
      body: JSON.stringify(body),
      cache: "no-store",
    });
    if (r.status === 503) {
      return { ok: false, data: null, status: 503, degraded: true };
    }
    const data = (await r.json().catch(() => null)) as T | null;
    return { ok: r.ok, data, status: r.status };
  } catch {
    return { ok: false, data: null, status: 0, degraded: true };
  }
}
