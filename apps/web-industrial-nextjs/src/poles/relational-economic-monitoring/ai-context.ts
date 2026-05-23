import type { PoleIntelSurface } from "../pole-intel-manifest";

export const RELATIONAL_ECONOMIC_MONITORING_AI_CONTEXT = {
  pole: "relational-economic-monitoring",
  scope: "executive_strategic_monitoring_read_only",
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
    "executive supervision",
    "systemic stability reading",
    "strategic alert consolidation",
    "multi-corridor coordination observation",
    "structural imbalance detection",
    "priority corridor watch",
  ],
} as const;

const ctx: PoleIntelSurface = {
  summaryLine:
    "Couche 20.33 — supervision stratégique exécutive relationnelle — stabilité systémique et alertes, pas exécution.",
  mapHintLine: "Lecture supervision — pression exécutive, risque systémique, coordination, urgences bornées.",
};

export default ctx;
