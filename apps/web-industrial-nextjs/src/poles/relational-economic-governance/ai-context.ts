import type { PoleIntelSurface } from "../pole-intel-manifest";

export const RELATIONAL_ECONOMIC_GOVERNANCE_AI_CONTEXT = {
  pole: "relational-economic-governance",
  scope: "multi_corridor_economic_governance_read_only",
  forbidden: [
    "GPS",
    "wallet",
    "payment",
    "ERP",
    "autopilot",
    "order mutation",
    "fulfillment execution",
    "public scoring",
    "generative AI",
  ],
  allowed: [
    "multi-corridor coordination",
    "conflict detection",
    "priority balancing",
    "systemic tension observation",
    "governance arbitration read",
  ],
} as const;

const ctx: PoleIntelSurface = {
  summaryLine:
    "Couche 20.30 — gouvernance économique multi-corridor — coordination et arbitrage analytiques, pas exécution automatique.",
  mapHintLine: "Lecture gouvernance — conflits, priorités, équilibre réseau bornés.",
};

export default ctx;
