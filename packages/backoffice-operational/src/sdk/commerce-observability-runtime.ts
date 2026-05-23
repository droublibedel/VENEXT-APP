export type CommerceObservabilityPlatform = "ios" | "android" | "web" | "desktop" | "unknown";

export type CommerceObservabilityRuntime = {
  platform: CommerceObservabilityPlatform;
  appVersion: string;
  buildNumber: string;
  releaseChannel: string;
  networkQuality: "good" | "fair" | "poor" | "offline" | "unknown";
  offlineMode: boolean;
  retryCount: number;
  deviceClass: "low" | "mid" | "high" | "unknown";
};

const DEFAULT_RUNTIME: CommerceObservabilityRuntime = {
  platform: "unknown",
  appVersion: "0.0.0",
  buildNumber: "0",
  releaseChannel: "development",
  networkQuality: "unknown",
  offlineMode: false,
  retryCount: 0,
  deviceClass: "unknown",
};

let runtime: CommerceObservabilityRuntime = { ...DEFAULT_RUNTIME };

export function configureCommerceObservabilityRuntime(
  partial: Partial<CommerceObservabilityRuntime>,
): CommerceObservabilityRuntime {
  runtime = { ...runtime, ...partial };
  return runtime;
}

export function getCommerceObservabilityRuntime(): CommerceObservabilityRuntime {
  return { ...runtime };
}

export function resetCommerceObservabilityRuntimeForTests(): void {
  runtime = { ...DEFAULT_RUNTIME };
}

/** Lit Vite/Next env sans dépendre d'un bundler précis. */
export function readAppVersionFromEnv(env: Record<string, string | undefined> = {}): {
  appVersion: string;
  buildNumber: string;
  releaseChannel: string;
} {
  const appVersion =
    env.VITE_APP_VERSION ??
    env.NEXT_PUBLIC_APP_VERSION ??
    env.VENEXT_APP_VERSION ??
    "0.0.0";
  const buildNumber =
    env.VITE_BUILD_NUMBER ??
    env.NEXT_PUBLIC_BUILD_NUMBER ??
    env.VENEXT_BUILD_NUMBER ??
    "0";
  const releaseChannel =
    env.VITE_RELEASE_CHANNEL ??
    env.NEXT_PUBLIC_RELEASE_CHANNEL ??
    env.VENEXT_RELEASE_CHANNEL ??
    "development";
  return { appVersion, buildNumber, releaseChannel };
}

export function inferNetworkQuality(): CommerceObservabilityRuntime["networkQuality"] {
  if (typeof navigator !== "undefined" && navigator.onLine === false) return "offline";
  const conn = (navigator as Navigator & { connection?: { effectiveType?: string } }).connection;
  const t = conn?.effectiveType;
  if (t === "4g") return "good";
  if (t === "3g") return "fair";
  if (t === "2g" || t === "slow-2g") return "poor";
  return "unknown";
}

export function inferDeviceClass(): CommerceObservabilityRuntime["deviceClass"] {
  if (typeof window === "undefined") return "unknown";
  const w = window.innerWidth;
  if (w < 360) return "low";
  if (w < 768) return "mid";
  return "high";
}
