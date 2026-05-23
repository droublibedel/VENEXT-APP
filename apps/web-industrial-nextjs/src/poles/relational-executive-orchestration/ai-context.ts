import type { PoleIntelSurface } from "../pole-intel-manifest";

export const RELATIONAL_EXECUTIVE_ORCHESTRATION_AI_CONTEXT = {
  pole: "relational-executive-orchestration",
  scope: "executive_strategic_orchestration_read_only",
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
    "executive matrix orchestration",
    "cross-corridor systemic exposure",
    "strategic alignment reading",
    "coordination breakdown detection",
    "executive dependency trace",
    "multi-corridor priority supervision",
  ],
} as const;

const ctx: PoleIntelSurface = {
  summaryLine:
    "Couche 20.34 — orchestration exécutive relationnelle — matrice de supervision stratégique, pas exécution.",
  mapHintLine: "Lecture orchestration — coordination, exposition systémique, alignement, dépendances bornées.",
};

export default ctx;
