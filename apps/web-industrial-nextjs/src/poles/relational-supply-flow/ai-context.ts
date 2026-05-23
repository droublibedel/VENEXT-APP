import type { PoleIntelSurface } from "../pole-intel-manifest";

/** Wording guard source (tests) — not generative autopilot vocabulary. */
export const RELATIONAL_SUPPLY_FLOW_AI_CONTEXT = {
  pole: "relational-supply-flow",
  scope: "corridor_supply_flow_intelligence_read_only",
  forbidden: [
    "delivery tracking",
    "truck tracking",
    "GPS",
    "parcel tracking",
    "wallet",
    "payment",
    "marketplace scoring",
    "autonomous procurement",
  ],
  allowed: [
    "supply flow intelligence",
    "corridor continuity",
    "operational bottleneck reading",
    "territorial dependency",
    "systemic propagation",
  ],
} as const;

const ctx: PoleIntelSurface = {
  summaryLine:
    "Couche supply-flow corridor-first (20.24) — continuité, pression, goulets, propagation — pas TMS/WMS ni tracking livraison.",
  mapHintLine:
    "Lecture infrastructure des flux économiques relationnels — dépendances et fragilités bornées, sans GPS ni wallet.",
};

export default ctx;
