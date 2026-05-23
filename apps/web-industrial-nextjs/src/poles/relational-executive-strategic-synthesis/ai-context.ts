import type { PoleIntelSurface } from "../pole-intel-manifest";

export const RELATIONAL_EXECUTIVE_STRATEGIC_SYNTHESIS_AI_CONTEXT = {
  pole: "relational-executive-strategic-synthesis",
  scope: "executive_strategic_synthesis_supervision_read_only",
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
    "deterministic strategic digests",
    "executive synthesis templates",
    "systemic pressure aggregation",
    "resilience oversight snapshots",
    "strategic alignment diagnostics",
  ],
} as const;

const ctx: PoleIntelSurface = {
  summaryLine:
    "Couche 20.40 — synthèse exécutive stratégique — digests consolidés déterministes, pas génération IA libre.",
  mapHintLine: "Supervision globale — score synthèse, exposition exécutive, digests templates, alignement borné.",
};

export default ctx;
