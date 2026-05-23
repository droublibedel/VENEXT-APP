export type CommerceFoundationFlags = {
  commerce_foundation_guardrails_enabled?: boolean;
  commerce_navigation_consistency_enabled?: boolean;
  commerce_anti_erp_wording_enabled?: boolean;
};

export type CommerceActorKind = "formal" | "terrain";

export type CommerceActorRole = "producteur" | "grossiste_a" | "grossiste_b" | "detaillant";

const FORBIDDEN_PRODUCT_DRIFT =
  /\b(erp|tms|wms|banque numérique|réseau social|supply chain enterprise|dashboard analytique)\b/i;

export function isCommerceFoundationGuardrailsEnabled(
  flags: CommerceFoundationFlags = {},
): boolean {
  return flags.commerce_foundation_guardrails_enabled !== false;
}

export function resolveCommerceActorKind(role: CommerceActorRole): CommerceActorKind {
  return role === "grossiste_b" || role === "detaillant" ? "terrain" : "formal";
}

export function assertVenextCommercePhilosophy(surfaceLabel: string): boolean {
  return !FORBIDDEN_PRODUCT_DRIFT.test(surfaceLabel);
}

export function commercePhilosophyReminder(): string {
  return "Infrastructure d'intelligence économique du commerce — pas ERP, pas banque, pas réseau social.";
}

export function isCommerceFirstSurface(testId: string | undefined): boolean {
  if (!testId) return true;
  const forbidden = [
    "erp-",
    "tms-",
    "wms-",
    "banking-dashboard",
    "social-feed",
    "supply-chain-control",
  ];
  return !forbidden.some((f) => testId.includes(f));
}
