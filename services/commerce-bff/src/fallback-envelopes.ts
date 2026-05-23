/** Instruction 20.79 — local fallback when core domain unavailable (demo only). */

export function fallbackEnvelope<T>(payload: T) {
  return {
    dataSource: "fallback" as const,
    fallbackUsed: true,
    payload,
  };
}

export function liveEnvelope<T>(payload: T) {
  return {
    dataSource: "live" as const,
    fallbackUsed: false,
    payload,
  };
}

export const FALLBACK_GROSSISTE_CATALOG = {
  organizationId: "org-grossiste-b-demo",
  products: [
    {
      id: "fb-p1",
      name: "Riz 25kg (démo)",
      category: "Alimentaire",
      availability: "available",
      priceLabel: "12 500 FCFA",
      city: "Abidjan",
    },
  ],
  popularIds: ["fb-p1"],
  promotions: [],
};

export const FALLBACK_WALLET_BALANCE = {
  availableLabel: "850 FCFA",
  currency: "XOF",
  demo: true,
};

export const FALLBACK_PRODUCER_CATALOG = {
  organizationId: "org-producer-agronexus-ci",
  products: [{ id: "fb-pr1", name: "Riz premium (démo)", category: "Agro" }],
  partnerCatalogs: 1,
};

export const FALLBACK_GROSSISTE_A_CATALOG = {
  organizationId: "org-grossiste-a-nord-plus",
  products: [{ id: "fb-ga1", name: "Riz 25kg réseau (démo)", category: "Alimentaire", availability: "available", rotation: "forte", demand: "high", networkCoverage: "Bouaké" }],
};
