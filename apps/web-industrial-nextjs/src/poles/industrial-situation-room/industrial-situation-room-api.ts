const BFF_PREFIX = "/api/industrial-situation-room";

export async function fetchIndustrialSituationRoomBundleJson<T>(organizationId: string): Promise<T | null> {
  const url = `${BFF_PREFIX}/v1/industrial-situation-room/bundle?organizationId=${encodeURIComponent(organizationId)}&projection=summary`;
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

export async function fetchIndustrialSituationRoomJson<T>(suffix: string, organizationId: string): Promise<T | null> {
  const base = `${BFF_PREFIX}/v1/industrial-situation-room${suffix}`;
  const sep = base.includes("?") ? "&" : "?";
  const url = `${base}${sep}organizationId=${encodeURIComponent(organizationId)}&projection=summary`;
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
