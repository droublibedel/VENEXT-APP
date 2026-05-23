import type { PoleIntelSurface } from "../pole-intel-manifest";

export const RELATIONAL_ECONOMIC_SOVEREIGNTY_AI_CONTEXT = {
  pole: "relational-economic-sovereignty",
  scope: "corridor_economic_sovereignty_read_only",
  forbidden: [
    "GPS",
    "wallet",
    "payment",
    "ERP",
    "generative AI",
    "autopilot",
    "public scoring",
    "banking system",
    "live tracking",
  ],
  allowed: [
    "economic sovereignty",
    "corridor autonomy",
    "dependency concentration",
    "captivity risk",
    "recovery autonomy",
    "strategic memory coupling",
  ],
} as const;

const ctx: PoleIntelSurface = {
  summaryLine:
    "Couche 20.27 — souveraineté économique relationnelle, autonomie corridor, dépendances critiques — pas ERP, pas scoring public.",
  mapHintLine:
    "Lecture command-center de l'autonomie corridor — exposition bornée, sans GPS ni wallet.",
};

export default ctx;
