import type { PoleIntelSurface } from "../pole-intel-manifest";

export const RELATIONAL_ECONOMIC_ARBITRATION_AI_CONTEXT = {
  pole: "relational-economic-arbitration",
  scope: "relational_economic_conflict_resolution_read_only",
  forbidden: [
    "GPS",
    "wallet",
    "payment",
    "pricing",
    "inventory mutation",
    "delivery execution",
    "autopilot",
    "order mutation",
    "partner mutation",
    "commercial allocation",
    "public tracking",
    "scraping",
    "social graph",
  ],
  allowed: [
    "arbitration workflow structuring",
    "corridor prioritization",
    "resolution scenario evaluation",
    "systemic impact identification",
    "human validation coordination",
    "network stabilization strategies",
  ],
} as const;

const ctx: PoleIntelSurface = {
  summaryLine:
    "Couche 20.31 — résolution de conflits économiques relationnels et arbitrage stratégique — analyse et gouvernance, pas exécution.",
  mapHintLine: "Scénarios déterministes, décisions journalisées, double validation pour containment systémique.",
};

export default ctx;
