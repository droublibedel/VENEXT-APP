import { CRITICAL_OBSERVABILITY_SCREENS, OPERATIONAL_JOURNEY_EVENTS } from "../sdk/operational-journey-events.js";
import { sanitizeLivePayload, sanitizeTechnicalMessage } from "../live-observability/backoffice-live-observability-sanitizer.js";

export type ObservabilityCoverageIssue = {
  code: string;
  severity: "error" | "warning";
  message: string;
};

export type ObservabilityCoverageReport = {
  ok: boolean;
  criticalScreensExpected: number;
  journeyEventFamilies: number;
  issues: ObservabilityCoverageIssue[];
};

const FORBIDDEN_METADATA_KEYS = /password|otp|token|secret|iban|cvv|pin|authorization/i;

/** Audit BACKOFFICE-01-D — couverture observabilité sans secrets ni stack brute UI. */
export function auditOperationalObservabilityCoverage(input?: {
  wiredScreens?: string[];
  wiredJourneyKeys?: string[];
  samplePayload?: Record<string, unknown>;
  sampleTechnicalMessage?: string;
}): ObservabilityCoverageReport {
  const issues: ObservabilityCoverageIssue[] = [];
  const wiredScreens = new Set(input?.wiredScreens ?? CRITICAL_OBSERVABILITY_SCREENS);
  const wiredJourneys = new Set(input?.wiredJourneyKeys ?? []);

  for (const screen of CRITICAL_OBSERVABILITY_SCREENS) {
    if (!wiredScreens.has(screen)) {
      issues.push({
        code: "screen_not_wired",
        severity: "warning",
        message: `Écran critique non déclaré branché: ${screen}`,
      });
    }
  }

  const journeyFamilies = Object.keys(OPERATIONAL_JOURNEY_EVENTS);
  for (const family of journeyFamilies) {
    const events = OPERATIONAL_JOURNEY_EVENTS[family as keyof typeof OPERATIONAL_JOURNEY_EVENTS];
    const keys = Object.values(events);
    if (!keys.length) continue;
    const canonical = keys[0].replace(/_started$|_start$|_success$/, "");
    if (input?.wiredJourneyKeys && !wiredJourneys.has(canonical) && !wiredJourneys.has(keys[0])) {
      issues.push({
        code: "journey_family_partial",
        severity: "warning",
        message: `Famille parcours ${family} — vérifier branchement live`,
      });
    }
  }

  if (input?.samplePayload) {
    const sanitized = sanitizeLivePayload(input.samplePayload);
    for (const key of Object.keys(input.samplePayload)) {
      if (FORBIDDEN_METADATA_KEYS.test(key) && sanitized[key] !== "[redacted]") {
        issues.push({
          code: "unsafe_metadata_key",
          severity: "error",
          message: `Clé sensible non redactée: ${key}`,
        });
      }
    }
    const rawStack = String(input.samplePayload.stack ?? input.samplePayload.internalStack ?? "");
    if (rawStack.includes("at ") && rawStack.includes(".tsx:")) {
      issues.push({
        code: "raw_stack_in_payload",
        severity: "error",
        message: "Stack brute détectée dans metadata — interdit côté UI",
      });
    }
  }

  if (input?.sampleTechnicalMessage) {
    const msg = sanitizeTechnicalMessage(input.sampleTechnicalMessage);
    if (msg.includes(".tsx:") || msg.includes(".js:")) {
      issues.push({
        code: "raw_stack_in_technical",
        severity: "error",
        message: "Stack brute dans technicalMessage",
      });
    }
  }

  const errors = issues.filter((i) => i.severity === "error");
  return {
    ok: errors.length === 0,
    criticalScreensExpected: CRITICAL_OBSERVABILITY_SCREENS.length,
    journeyEventFamilies: journeyFamilies.length,
    issues,
  };
}
