import type { PoleIntelSurface } from "../pole-intel-manifest";

export const RELATIONAL_MACRO_ECONOMIC_AI_CONTEXT = {
  pole: "relational-macro-economic",
  scope: "corridor_macro_economic_resilience_read_only",
  forbidden: [
    "delivery tracking",
    "truck tracking",
    "GPS",
    "parcel tracking",
    "wallet",
    "payment",
    "marketplace scoring",
    "generative AI",
    "autonomous autopilot",
    "public supplier rating",
  ],
  allowed: [
    "macro-economic resilience",
    "systemic pressure",
    "territorial fragility",
    "corridor dependency exposure",
    "bounded propagation",
    "adaptation capacity reading",
  ],
} as const;

const ctx: PoleIntelSurface = {
  summaryLine:
    "Couche 20.25 — résilience macro-économique relationnelle, pression systémique, fragilité territoriale — pas ERP, pas notation publique.",
  mapHintLine:
    "Lecture command-center des vulnérabilités corridor — propagation bornée, sans GPS ni wallet.",
};

export default ctx;
