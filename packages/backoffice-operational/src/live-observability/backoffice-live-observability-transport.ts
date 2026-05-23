export type LiveTransportConfig = {
  baseUrl: string;
  telemetryKey?: string;
  enabled: boolean;
};

let config: LiveTransportConfig = {
  baseUrl: "",
  enabled: true,
};

export function configureLiveObservabilityTransport(input: Partial<LiveTransportConfig>): void {
  config = { ...config, ...input };
}

export function isLiveTransportEnabled(): boolean {
  return config.enabled;
}

/** Envoi silencieux — jamais de throw vers l'appelant. */
export async function postLiveBatch(
  path: string,
  body: unknown,
): Promise<{ ok: boolean; status: number }> {
  if (!config.enabled) return { ok: true, status: 204 };
  const url = `${config.baseUrl.replace(/\/$/, "")}${path.startsWith("/") ? path : `/${path}`}`;
  try {
    const headers: Record<string, string> = {
      "content-type": "application/json",
      "x-venext-live-telemetry": "1",
    };
    if (config.telemetryKey) headers["x-venext-telemetry-key"] = config.telemetryKey;

    const res = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
      keepalive: true,
      signal: AbortSignal.timeout(8_000),
    });
    return { ok: res.ok, status: res.status };
  } catch {
    return { ok: false, status: 0 };
  }
}
