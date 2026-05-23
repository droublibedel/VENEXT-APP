import type { PoleIntelSurface } from "../pole-intel-manifest";

export const RELATIONAL_MACRO_OBSERVATORY_GOVERNANCE_AI_CONTEXT = {
  pole: "relational-macro-observatory-governance",
  scope: "macro_observatory_governance_analytical_read_only",
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
    "deterministic governance matrices",
    "network coordination templates",
    "systemic governance concentration",
    "executive alignment diagnostics",
    "territorial balance matrices",
  ],
} as const;

const ctx: PoleIntelSurface = {
  summaryLine:
    "Couche 20.43 — gouvernance macro-observatoire — matrices réseau déterministes, pas duplication supervision/command/synthesis.",
  mapHintLine: "Coordination réseau — score gouvernance macro, pression coordination exécutive, matrices templates.",
};

export default ctx;
