import type { PoleIntelSurface } from "../pole-intel-manifest";

export const RELATIONAL_ECONOMIC_RECOVERY_AI_CONTEXT = {
  pole: "relational-economic-recovery",
  scope: "corridor_economic_recovery_planning_read_only",
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
    "recovery planning",
    "intervention sequencing",
    "dependency recovery map",
    "priority engine",
    "sovereignty continuity macro coupling",
  ],
} as const;

const ctx: PoleIntelSurface = {
  summaryLine:
    "Couche 20.29 — planification de reprise économique corridor — analyse et séquencement, pas exécution automatique.",
  mapHintLine: "Lecture recovery planning — priorités, dépendances, risques systémiques bornés.",
};

export default ctx;
