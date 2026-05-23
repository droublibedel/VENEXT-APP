import { liveEventFingerprint, shouldDedupeLiveEvent } from "./backoffice-live-observability-dedupe.js";
import { pushLiveBufferedEvent } from "./backoffice-live-observability-buffer.js";
import { resolveLiveOperationalContext } from "./backoffice-live-observability-context.js";
import { sanitizeLivePayload } from "./backoffice-live-observability-sanitizer.js";
import { scheduleLiveObservabilityFlush } from "./backoffice-live-observability-flush.js";

export type BlockageSeverity = "LOW" | "MODERATE" | "HIGH" | "CRITICAL";

type SignalState = {
  errorCounts: Map<string, number>;
  retryLoops: Map<string, number>;
  lastScreenAt: Map<string, number>;
  rageClicks: Map<string, number>;
};

const state: SignalState = {
  errorCounts: new Map(),
  retryLoops: new Map(),
  lastScreenAt: new Map(),
  rageClicks: new Map(),
};

export function resetBlockageDetectorForTests(): void {
  state.errorCounts.clear();
  state.retryLoops.clear();
  state.lastScreenAt.clear();
  state.rageClicks.clear();
}

export function detectUserOperationalBlockage(input: {
  screen: string;
  signal: "error_repeat" | "retry_loop" | "rage_click" | "long_abandon" | "navigation_stuck";
  errorType?: string;
  journeyKey?: string;
}): { severity: BlockageSeverity; code: string } | null {
  const key = `${input.screen}:${input.signal}`;
  let severity: BlockageSeverity = "LOW";
  let code: string = input.signal;

  if (input.signal === "error_repeat" && input.errorType) {
    const n = (state.errorCounts.get(input.errorType) ?? 0) + 1;
    state.errorCounts.set(input.errorType, n);
    if (n >= 5) severity = "CRITICAL";
    else if (n >= 3) severity = "HIGH";
    else if (n >= 2) severity = "MODERATE";
    code = `error_repeat_${input.errorType}`;
  }

  if (input.signal === "retry_loop") {
    const rk = input.journeyKey ?? input.screen;
    const n = (state.retryLoops.get(rk) ?? 0) + 1;
    state.retryLoops.set(rk, n);
    if (n >= 4) severity = "CRITICAL";
    else if (n >= 3) severity = "HIGH";
    else severity = "MODERATE";
    code = `retry_loop_${rk}`;
  }

  if (input.signal === "rage_click") {
    const n = (state.rageClicks.get(input.screen) ?? 0) + 1;
    state.rageClicks.set(input.screen, n);
    if (n >= 6) severity = "HIGH";
    else if (n >= 4) severity = "MODERATE";
    code = `rage_click_${input.screen}`;
  }

  if (input.signal === "long_abandon" || input.signal === "navigation_stuck") {
    severity = "HIGH";
  }

  if (severity === "LOW" && input.signal !== "long_abandon") return null;

  const fp = liveEventFingerprint(["blockage", code, input.screen]);
  if (shouldDedupeLiveEvent(fp, 30_000)) return null;

  return { severity, code };
}

export function reportLiveUserBlockage(input: {
  screen: string;
  signal: "error_repeat" | "retry_loop" | "rage_click" | "long_abandon" | "navigation_stuck";
  errorType?: string;
  journeyKey?: string;
}): void {
  const detected = detectUserOperationalBlockage(input);
  if (!detected) return;
  const ctx = resolveLiveOperationalContext({ screen: input.screen });
  pushLiveBufferedEvent({
    kind: "blockage",
    priority: detected.severity === "CRITICAL" ? 95 : detected.severity === "HIGH" ? 75 : 40,
    payload: sanitizeLivePayload({
      ...ctx,
      code: detected.code,
      severity: detected.severity,
      signal: input.signal,
      errorType: input.errorType,
      journeyKey: input.journeyKey,
    }),
  });
  scheduleLiveObservabilityFlush();
}
