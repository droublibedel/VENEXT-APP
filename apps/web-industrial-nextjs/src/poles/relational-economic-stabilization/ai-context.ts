import type { PoleIntelSurface } from "../pole-intel-manifest";

export const RELATIONAL_ECONOMIC_STABILIZATION_AI_CONTEXT = {
  pole: "relational-economic-stabilization",
  scope: "multi_corridor_economic_stabilization_read_only",
  forbidden: [
    "GPS",
    "wallet",
    "payment",
    "order execution",
    "inventory mutation",
    "delivery workflow",
    "autopilot",
    "operational workflow trigger",
    "public tracking",
    "social graph",
    "marketing",
    "scraping",
  ],
  allowed: [
    "strategic stabilization orchestration",
    "fragile corridor detection",
    "critical corridor coordination",
    "systemic resilience evaluation",
    "structural imbalance detection",
    "instability impact projection",
  ],
} as const;

const ctx: PoleIntelSurface = {
  summaryLine:
    "Couche 20.32 — stabilisation économique relationnelle multi-corridor — résilience et coordination stratégique, pas exécution.",
  mapHintLine: "Lecture stabilisation — pression, résilience, dépendances, exposition systémique bornées.",
};

export default ctx;
