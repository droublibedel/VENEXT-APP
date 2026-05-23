const BFF_PREFIX = "/api/industrial-evidence";

export async function fetchIndustrialEvidenceBundleJson<T>(
  organizationId: string,
  projection: "summary" | "full" = "summary",
): Promise<T | null> {
  const url = `${BFF_PREFIX}/v1/industrial-evidence/bundle?organizationId=${encodeURIComponent(organizationId)}&projection=${projection}`;
  try {
    const r = await fetch(url, { credentials: "include", cache: "no-store" });
    if (r.status === 403 || r.status === 404) return null;
    if (!r.ok) return null;
    return (await r.json()) as T;
  } catch {
    return null;
  }
}

function unwrapSliceEnvelope<T>(body: unknown): T | null {
  if (body && typeof body === "object" && "data" in body) {
    return (body as { data: T }).data;
  }
  return body as T | null;
}

export async function fetchIndustrialEvidenceJson<T>(
  suffix: string,
  organizationId: string,
  projection: "summary" | "full" = "summary",
): Promise<T | null> {
  const base = `${BFF_PREFIX}/v1/industrial-evidence${suffix}`;
  const sep = base.includes("?") ? "&" : "?";
  const url = `${base}${sep}organizationId=${encodeURIComponent(organizationId)}&projection=${projection}`;
  try {
    const r = await fetch(url, { credentials: "include", cache: "no-store" });
    if (r.status === 403 || r.status === 404) return null;
    if (!r.ok) return null;
    const body = await r.json();
    return unwrapSliceEnvelope<T>(body);
  } catch {
    return null;
  }
}
