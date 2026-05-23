import type { PoleIntelSurface } from "../pole-intel-manifest";

export const RELATIONAL_GLOBAL_EXECUTIVE_SUPERVISION_AI_CONTEXT = {
  pole: "relational-global-executive-supervision",
  scope: "global_executive_supervision_read_only",
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
    "deterministic executive matrices",
    "global supervision templates",
    "systemic exposure aggregation",
    "network resilience oversight snapshots",
    "strategic alignment diagnostics",
  ],
} as const;

const ctx: PoleIntelSurface = {
  summaryLine:
    "Couche 20.41 — supervision exécutive globale — matrices consolidées déterministes, pas génération IA libre.",
  mapHintLine: "Coordination maître — score supervision, pression exécutive, matrices templates, alignement borné.",
};

export default ctx;
