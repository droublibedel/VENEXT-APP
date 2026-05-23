import type { PoleIntelSurface } from "../pole-intel-manifest";

export const RELATIONAL_STRATEGIC_OBSERVATORY_AI_CONTEXT = {
  pole: "relational-strategic-observatory",
  scope: "strategic_observatory_analytical_read_only",
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
    "deterministic strategic grids",
    "macro coordination templates",
    "systemic concentration aggregation",
    "network resilience oversight",
    "territorial coordination diagnostics",
  ],
} as const;

const ctx: PoleIntelSurface = {
  summaryLine:
    "Couche 20.42 — observatoire économique stratégique — grilles consolidées déterministes, pas génération IA libre.",
  mapHintLine: "Coordination macro — score observatoire, exposition exécutive, grilles templates, alignement borné.",
};

export default ctx;
