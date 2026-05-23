import type { PoleIntelSurface } from "../pole-intel-manifest";

export const RELATIONAL_EXECUTIVE_OPERATIONS_AI_CONTEXT = {
  pole: "relational-executive-operations",
  scope: "executive_operations_supervision_read_only",
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
    "deterministic supervision matrices",
    "executive operations templates",
    "systemic concentration aggregation",
    "resilience oversight snapshots",
    "strategic balance diagnostics",
  ],
} as const;

const ctx: PoleIntelSurface = {
  summaryLine:
    "Couche 20.38 — opérations exécutives stratégiques — matrices de supervision déterministes, pas génération IA libre.",
  mapHintLine: "Supervision décisionnelle — score opérations, pression exécutive, matrices templates, équilibre borné.",
};

export default ctx;
