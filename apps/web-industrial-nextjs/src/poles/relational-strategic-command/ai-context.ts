import type { PoleIntelSurface } from "../pole-intel-manifest";

export const RELATIONAL_STRATEGIC_COMMAND_AI_CONTEXT = {
  pole: "relational-strategic-command",
  scope: "strategic_command_supervision_read_only",
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
    "deterministic command grids",
    "executive supervision templates",
    "systemic pressure aggregation",
    "resilience oversight snapshots",
    "strategic balance diagnostics",
  ],
} as const;

const ctx: PoleIntelSurface = {
  summaryLine:
    "Couche 20.37 — command center stratégique — grilles de supervision déterministes, pas génération IA libre.",
  mapHintLine: "Supervision exécutive — score command, pression systémique, grilles templates, équilibre borné.",
};

export default ctx;
