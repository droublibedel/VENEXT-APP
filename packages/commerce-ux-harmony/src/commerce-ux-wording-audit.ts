import {
  assertCommerceFoundationWording,
  containsForbiddenEnterpriseWording,
  sanitizeCommerceFoundationText,
} from "commerce-foundation-guardrails";

const JARGON_BLOCKLIST = [
  "workflow",
  "pipeline",
  "ticket",
  "erp",
  "dashboard bancaire",
  "supply chain",
  "engagement social",
  "ranking",
  "unauthorized",
  "forbidden",
];

export function auditVisibleCopy(text: string): { ok: boolean; issues: string[] } {
  const issues: string[] = [];
  const lower = text.toLowerCase();
  for (const word of JARGON_BLOCKLIST) {
    if (lower.includes(word)) issues.push(word);
  }
  if (containsForbiddenEnterpriseWording(text)) {
    issues.push("enterprise_wording");
  }
  try {
    assertCommerceFoundationWording(text);
  } catch {
    issues.push("foundation_wording");
  }
  return { ok: issues.length === 0, issues };
}

export function harmonizeVisibleCopy(text: string): string {
  return sanitizeCommerceFoundationText(text);
}
