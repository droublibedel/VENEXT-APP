import type { PoleIntelSurface } from "../pole-intel-manifest";

export const RELATIONAL_EXECUTIVE_CONTROL_ROOM_AI_CONTEXT = {
  pole: "relational-executive-control-room",
  scope: "executive_control_room_supervision_read_only",
  forbidden: [
    "GPS",
    "wallet",
    "payment",
    "order execution",
    "inventory mutation",
    "delivery workflow",
    "autopilot",
    "chatbot",
    "LLM",
    "generative summary",
    "hallucinated text",
    "operational workflow trigger",
    "public tracking",
    "social graph",
    "marketing",
    "scraping",
    "ERP",
  ],
  allowed: [
    "deterministic decision boards",
    "executive control room templates",
    "systemic concentration aggregation",
    "resilience oversight snapshots",
    "strategic balance diagnostics",
  ],
} as const;

const ctx: PoleIntelSurface = {
  summaryLine:
    "Couche 20.39 — salle de contrôle exécutive — decision boards déterministes, pas génération IA libre.",
  mapHintLine: "Supervision institutionnelle — score control room, pression exécutive, boards templates, équilibre borné.",
};

export default ctx;
