import type { VenextActorSurface } from "./venext-v1-readiness.types";

/** V1 functional freeze scope (Instruction 20.86) — documentation mirror in code. */

export const VENEXT_V1_INCLUDED_MODULES = [
  "relational-commerce-catalog",
  "relational-order-orchestration",
  "commercial-delivery-flow",
  "commerce-wallet",
  "commerce-notifications",
  "commercial-activity-feed",
  "commerce-messaging",
  "professional-commercial-network",
  "commercial-context-routing",
  "commerce-offline-foundation",
  "commerce-access-control",
  "venext-auth-foundation",
  "venext-i18n",
  "commerce-foundation-guardrails",
  "commerce-ux-harmony",
  "commerce-performance-foundation",
] as const;

export const VENEXT_V1_EXCLUDED = [
  "marketplace publique",
  "réseau social",
  "ERP cockpit",
  "fintech app",
  "super-app",
  "websocket temps réel",
  "polling agressif",
  "supply chain enterprise",
  "analytics enterprise massif",
] as const;

export const VENEXT_V1_LATER = [
  "expansion marketplace ouverte",
  "orchestration logistique lourde",
  "scoring crédit bancaire",
  "feed social partenaires",
] as const;

export const VENEXT_V1_ACTOR_SURFACES: VenextActorSurface[] = [
  "producteur",
  "grossiste_a",
  "grossiste_b",
  "detaillant",
];

export function isV1ActorSurface(actor: string): actor is VenextActorSurface {
  return (VENEXT_V1_ACTOR_SURFACES as readonly string[]).includes(actor);
}
