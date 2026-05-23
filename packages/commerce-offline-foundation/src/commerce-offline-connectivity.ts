import { useCallback, useEffect, useState } from "react";

import type { CommerceConnectivityMode, CommerceOfflineFlags } from "./commerce-offline.types";
import { COMMERCE_OFFLINE_CONNECTIVITY_PROBE_MS } from "./commerce-offline.types";

export function resolveConnectivityMode(input: {
  online?: boolean;
  apiReachable?: boolean;
  slowLink?: boolean;
}): CommerceConnectivityMode {
  if (input.online === false) return "OFFLINE";
  if (input.apiReachable === false) return "OFFLINE";
  if (input.slowLink) return "DEGRADED";
  if (input.online === true && input.apiReachable === true) return "ONLINE";
  return "DEGRADED";
}

export async function probeApiReachability(
  url = "/api/health",
  timeoutMs = COMMERCE_OFFLINE_CONNECTIVITY_PROBE_MS,
): Promise<boolean> {
  if (typeof fetch === "undefined") return true;
  const ac = new AbortController();
  const timer = setTimeout(() => ac.abort(), timeoutMs);
  try {
    const res = await fetch(url, { method: "GET", cache: "no-store", signal: ac.signal });
    return res.ok;
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
  }
}

export function readBrowserOnline(): boolean {
  if (typeof navigator === "undefined") return true;
  return navigator.onLine !== false;
}

export function useCommerceConnectivity(flags: CommerceOfflineFlags = {}) {
  const [mode, setMode] = useState<CommerceConnectivityMode>("ONLINE");

  const refresh = useCallback(async () => {
    if (flags.commerce_offline_foundation_enabled === false) {
      setMode("ONLINE");
      return;
    }
    const online = readBrowserOnline();
    const apiReachable = online ? await probeApiReachability() : false;
    const conn =
      typeof navigator !== "undefined" &&
      "connection" in navigator &&
      (navigator as Navigator & { connection?: { effectiveType?: string } }).connection
        ?.effectiveType;
    const slowLink = conn === "2g" || conn === "slow-2g";
    setMode(resolveConnectivityMode({ online, apiReachable, slowLink }));
  }, [flags.commerce_offline_foundation_enabled]);

  useEffect(() => {
    void refresh();
    if (typeof window === "undefined") return;
    const onOnline = () => void refresh();
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOnline);
    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOnline);
    };
  }, [refresh]);

  return { mode, refresh };
}
