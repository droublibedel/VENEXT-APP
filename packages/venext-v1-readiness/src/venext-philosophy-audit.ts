import {
  assertCommerceFoundationWording,
  containsForbiddenEnterpriseWording,
  sanitizeCommerceFoundationText,
} from "commerce-foundation-guardrails";

const FORBIDDEN_PRODUCT_PATTERNS = [
  /\bmarketplace\s+publique\b/i,
  /\bréseau\s+social\b/i,
  /\berp\b/i,
  /\bfintech\s+app\b/i,
  /\bsuper[\s-]?app\b/i,
  /\bsupply\s+chain\s+enterprise\b/i,
  /\bwebsocket\b/i,
  /\bsocket\.io\b/i,
  /\bdashboard\s+erp\b/i,
  /\bdashboard\s+bancaire\b/i,
  /\bengagement\s+social\b/i,
  /\branking\s+public\b/i,
];

export function auditVenextPhilosophyCopy(text: string): { ok: boolean; violations: string[] } {
  const violations: string[] = [];
  const lower = text.toLowerCase();

  for (const pattern of FORBIDDEN_PRODUCT_PATTERNS) {
    if (pattern.test(text)) violations.push(pattern.source);
  }

  if (containsForbiddenEnterpriseWording(text)) {
    violations.push("enterprise_wording");
  }

  try {
    assertCommerceFoundationWording(sanitizeCommerceFoundationText(text));
  } catch {
    violations.push("foundation_wording");
  }

  if (lower.includes("workflow") && lower.includes("pipeline")) {
    violations.push("workflow_pipeline");
  }

  return { ok: violations.length === 0, violations };
}

export function assertCommerceFirstProduct(): string[] {
  return [
    "commerce-first",
    "relationship-first",
    "closed network",
    "relational catalog",
    "partner commerce",
  ];
}
