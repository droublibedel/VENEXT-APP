import { sanitizeLivePayload, sanitizeTechnicalMessage } from "../live-observability/backoffice-live-observability-sanitizer.js";

export type DataSanitizationIssue = {
  code: string;
  path: string;
  message: string;
};

export type DataSanitizationReport = {
  ok: boolean;
  issues: DataSanitizationIssue[];
};

const FORBIDDEN = /password|otp|token|secret|iban|cvv|pin|authorization|bearer|stack|session|api[_-]?key/i;

function walk(obj: unknown, path: string, issues: DataSanitizationIssue[]): void {
  if (!obj || typeof obj !== "object") return;
  if (Array.isArray(obj)) {
    obj.slice(0, 30).forEach((v, i) => walk(v, `${path}[${i}]`, issues));
    return;
  }
  for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
    const p = path ? `${path}.${key}` : key;
    if (FORBIDDEN.test(key) && value !== "[redacted]") {
      issues.push({ code: "forbidden_key", path: p, message: `Clé sensible: ${key}` });
    }
    if (typeof value === "string") {
      if (/\b\d{6}\b/.test(value) && key.toLowerCase().includes("otp")) {
        issues.push({ code: "raw_otp", path: p, message: "OTP brut détecté" });
      }
      if (/eyJ[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+/.test(value)) {
        issues.push({ code: "raw_token", path: p, message: "Token JWT détecté" });
      }
      if (/at\s+[\w./]+\.(tsx?|js):\d+/.test(value)) {
        issues.push({ code: "raw_stack", path: p, message: "Stack brute UI" });
      }
    }
    if (value && typeof value === "object") walk(value, p, issues);
  }
}

/** Audit BACKOFFICE-01-E — aucune donnée sensible dans observabilité. */
export function auditOperationalDataSanitization(input: {
  payload?: Record<string, unknown>;
  technicalMessage?: string;
}): DataSanitizationReport {
  const issues: DataSanitizationIssue[] = [];
  if (input.payload) {
    const sanitized = sanitizeLivePayload(input.payload);
    walk(input.payload, "", issues);
    walk(sanitized, "sanitized", issues.filter((i) => i.code === "forbidden_key"));
  }
  if (input.technicalMessage) {
    const m = sanitizeTechnicalMessage(input.technicalMessage);
    if (m.includes(".tsx:") || m.includes(".js:")) {
      issues.push({ code: "technical_stack", path: "technicalMessage", message: "Stack dans message technique" });
    }
  }
  return { ok: issues.length === 0, issues };
}
