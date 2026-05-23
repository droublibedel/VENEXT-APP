/** Fixed demo UUIDs — aligned with `prisma/seed.ts` (Instruction 7 §18). */
export const DEMO_ACTOR = {
  userId: "21111111-1111-1111-1111-111111111103",
  organizationId: "31111111-1111-1111-1111-111111111103",
} as const;

/** Instruction 20.2 — retailer ciblé par la campagne seed `sCamp1` (RETAILER / SN). */
export const DEMO_SPONSORED_ACTOR = {
  userId: "21111111-1111-1111-1111-111111111201",
  organizationId: "31111111-1111-1111-1111-111111111201",
} as const;

/** Instruction 20.2 — seed `prisma/seed.ts` campaign `sCamp1`. */
export const DEMO_SPONSORED_CAMPAIGN_ID = "f5111111-1111-4111-8111-111111111001" as const;

/** Instruction 20.1A — forwarded by Next `/api/core` proxy to core-domain `VenextRequestActor` headers. */
export function venextActorHeaders(actor: { userId: string; organizationId: string }): Record<string, string> {
  return {
    "x-venext-user-id": actor.userId,
    "x-venext-acting-organization-id": actor.organizationId,
  };
}

export const DEMO_THREADS = {
  negotiationRaw: "91111111-1111-1111-1111-111111111001",
  delivery: "91111111-1111-1111-1111-111111111002",
  rejectedSponsor: "91111111-1111-1111-1111-111111111003",
  cartConverted: "91111111-1111-1111-1111-111111111004",
  paymentProof: "91111111-1111-1111-1111-111111111005",
} as const;

export const DEMO_PRODUCT_RAW = "61111111-1111-1111-1111-111111111001";
export const DEMO_SELLER_ORG = "31111111-1111-1111-1111-111111111101";
/** Seed `prisma/seed.ts` — negotiation linked to DEMO_PRODUCT_RAW + buyer/seller corridor. */
export const DEMO_NEGOTIATION_RAW = "81111111-1111-1111-1111-111111111001";

export function commerceWsUrl(): string {
  if (typeof process !== "undefined" && process.env.NEXT_PUBLIC_VENEXT_COMMERCE_WS) {
    return process.env.NEXT_PUBLIC_VENEXT_COMMERCE_WS;
  }
  if (typeof window !== "undefined") {
    const host = window.location.hostname;
    return `ws://${host}:3000/commerce-realtime`;
  }
  return "ws://127.0.0.1:3000/commerce-realtime";
}
