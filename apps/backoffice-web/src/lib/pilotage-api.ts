const SESSION_KEY = "venext_backoffice_session";

export function getPilotageSessionToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(SESSION_KEY);
}

export function setPilotageSessionToken(token: string): void {
  localStorage.setItem(SESSION_KEY, token);
}

export function clearPilotageSessionToken(): void {
  localStorage.removeItem(SESSION_KEY);
}

export async function pilotageFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = getPilotageSessionToken();
  const headers = new Headers(init.headers);
  headers.set("Content-Type", "application/json");
  if (token) headers.set("Authorization", `Bearer ${token}`);
  const res = await fetch(`/api/bff${path}`, { ...init, headers });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw Object.assign(new Error("pilotage_api_error"), { status: res.status, body });
  }
  return res.json() as Promise<T>;
}
