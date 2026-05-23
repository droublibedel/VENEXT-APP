import type { PoleIntelSurface } from "../pole-intel-manifest";

export const RELATIONAL_INSTITUTIONAL_REPORTING_AI_CONTEXT = {
  pole: "relational-strategic-intelligence",
  scope: "institutional_strategic_reporting_read_only",
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
  ],
  allowed: [
    "deterministic executive briefs",
    "institutional corridor reporting",
    "structured strategic intelligence",
    "systemic risk aggregation",
    "governance resilience snapshots",
    "template-based summaries",
  ],
} as const;

const ctx: PoleIntelSurface = {
  summaryLine:
    "Couche 20.35 — reporting institutionnel économique — briefs structurés déterministes, pas génération IA libre.",
  mapHintLine: "Lecture institutionnelle — score, risque exécutif, briefs templates, alignement bornés.",
};

export default ctx;
