import type { PoleIntelSurface } from "../pole-intel-manifest";

export const RELATIONAL_ECONOMIC_CONTINUITY_AI_CONTEXT = {
  pole: "relational-economic-continuity",
  scope: "corridor_economic_continuity_read_only",
  forbidden: [
    "delivery tracking",
    "GPS",
    "wallet",
    "payment",
    "marketplace scoring",
    "generative AI",
    "autonomous autopilot",
    "ERP automation",
    "public supplier rating",
  ],
  allowed: [
    "economic continuity",
    "corridor durability",
    "instability long-term",
    "recovery projection",
    "strategic memory coupling",
    "bounded recovery traversal",
  ],
} as const;

const ctx: PoleIntelSurface = {
  summaryLine:
    "Couche 20.26 — stabilité & continuité économique relationnelle, récupération corridor, instabilité longue durée — pas ERP, pas autopilot.",
  mapHintLine:
    "Lecture command-center de la continuité corridor — historique snapshots, sans GPS ni wallet.",
};

export default ctx;
