import { isTechnicalErrorVisible } from "./commerce-humanized-errors";

export type HumanizedErrorAuditIssue = {
  source: string;
  snippet: string;
  reason: string;
};

const RISKY_UI_PATTERNS: { id: string; pattern: RegExp; reason: string }[] = [
  { id: "alert", pattern: /\balert\s*\(/, reason: "alert() peut exposer du texte brut" },
  { id: "console-error-ui", pattern: /dangerouslySetInnerHTML.*error/i, reason: "HTML erreur brut" },
  { id: "http-code", pattern: /\b(404|500|403)\b/, reason: "Code HTTP visible" },
  { id: "stack", pattern: /at\s+\w+\.\w+/, reason: "Stack trace visible" },
];

export function auditHumanizedErrorsCoverage(sources: Record<string, string>): {
  ok: boolean;
  issues: HumanizedErrorAuditIssue[];
} {
  const issues: HumanizedErrorAuditIssue[] = [];

  for (const [source, content] of Object.entries(sources)) {
    for (const rule of RISKY_UI_PATTERNS) {
      if (rule.pattern.test(content)) {
        issues.push({ source, snippet: content.slice(0, 120), reason: rule.reason });
      }
    }
    const lines = content.split("\n");
    for (const line of lines) {
      if (line.includes("userMessage") || line.includes("role=\"alert\"")) continue;
      if (isTechnicalErrorVisible(line)) {
        issues.push({
          source,
          snippet: line.slice(0, 120),
          reason: "Message potentiellement technique visible",
        });
      }
    }
  }

  return { ok: issues.length === 0, issues };
}

export function isCommerceHumanizedErrorsEnabled(
  flags: { commerce_humanized_errors_enabled?: boolean } = {},
): boolean {
  return flags.commerce_humanized_errors_enabled !== false;
}
