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

export const FALLBACK_DETAILLANT_HOME = {
  organizationId: "org-detaillant-yopougon",
  activityToday: 18,
  salesTodayLabel: "142 500 FCFA",
  popularProducts: [
    { id: "dt-p1", name: "Eau minérale 1.5L x6", category: "boissons" },
    { id: "dt-p2", name: "Biscuits assortis", category: "biscuits" },
    { id: "dt-p3", name: "Huile 1L", category: "huile" },
  ],
  recentOrders: [
    { id: "dt-o1", partner: "Grossiste Plateau", amountLabel: "28 400 FCFA", status: "En cours" },
    { id: "dt-o2", partner: "Semi-grossiste Nord", amountLabel: "15 200 FCFA", status: "Reçue" },
  ],
  simpleAlerts: [
    { id: "dt-a1", text: "2 commandes à suivre aujourd'hui" },
    { id: "dt-a2", text: "Promo boissons jusqu'à ce soir" },
  ],
  activePartners: 8,
  discreetSuggestions: ["Renforcer le rayon boissons", "Vérifier le stock biscuits"],
};

export const FALLBACK_DETAILLANT_PRODUCTS = {
  organizationId: "org-detaillant-yopougon",
  products: [
    {
      id: "dt-pr1",
      name: "Eau minérale 1.5L x6",
      category: "boissons",
      availability: "available",
      priceLabel: "2 100 FCFA",
      badge: "tres-demande",
      city: "Abidjan",
    },
    {
      id: "dt-pr2",
      name: "Biscuits assortis",
      category: "biscuits",
      availability: "available",
      priceLabel: "750 FCFA",
      badge: "disponible",
      promotion: "-10% aujourd'hui",
      city: "Abidjan",
    },
    {
      id: "dt-pr3",
      name: "Huile 1L",
      category: "huile",
      availability: "limited",
      priceLabel: "1 180 FCFA",
      badge: "stock-limite",
      city: "Bouaké",
    },
  ],
  popularIds: ["dt-pr1", "dt-pr2"],
  promotions: [{ id: "dt-promo1", label: "Pack boissons — prix réseau Abidjan" }],
};

export const FALLBACK_DETAILLANT_ORDERS = {
  organizationId: "org-detaillant-yopougon",
  enCours: [
    {
      id: "dt-c1",
      partner: "Grossiste Plateau",
      city: "Abidjan",
      status: "en-cours",
      items: 6,
      amountLabel: "28 400 FCFA",
      updatedAt: "Aujourd'hui 09:12",
    },
  ],
  recues: [
    {
      id: "dt-r1",
      partner: "Semi-grossiste Nord",
      city: "Bouaké",
      status: "recue",
      items: 4,
      amountLabel: "15 200 FCFA",
      updatedAt: "Aujourd'hui 08:00",
    },
  ],
  terminees: [
    {
      id: "dt-t1",
      partner: "Boutique voisine",
      city: "Abidjan",
      status: "terminee",
      items: 3,
      amountLabel: "8 900 FCFA",
      updatedAt: "Hier 14:00",
    },
  ],
};

export const FALLBACK_DETAILLANT_NETWORK = {
  organizationId: "org-detaillant-yopougon",
  activeSuppliers: [
    { id: "dt-s1", name: "Grossiste Plateau", type: "grossiste", city: "Abidjan" },
    { id: "dt-s2", name: "Semi-grossiste Nord", type: "semi-grossiste", city: "Bouaké" },
  ],
  newPartners: [{ id: "dt-n1", name: "Boutique Marcory", city: "Abidjan", since: "Cette semaine" }],
  cityActivity: [
    { city: "Abidjan", level: "active" },
    { city: "Bouaké", level: "moderate" },
    { city: "Korhogo", level: "active" },
  ],
  trendingProducts: [
    { id: "dt-tp1", name: "Eau 1.5L", note: "Très demandé" },
    { id: "dt-tp2", name: "Biscuits", note: "Rotation rapide" },
  ],
  networkSuggestions: ["Commander huile avant rupture", "Votre grossiste Plateau est actif"],
};

export function fallbackDetaillantEndpoint(endpoint: string, organizationId: string) {
  const withOrg = <T extends { organizationId: string }>(payload: T): T => ({
    ...payload,
    organizationId,
  });

  switch (endpoint) {
    case "home":
      return withOrg(FALLBACK_DETAILLANT_HOME);
    case "products":
      return withOrg(FALLBACK_DETAILLANT_PRODUCTS);
    case "orders":
      return withOrg(FALLBACK_DETAILLANT_ORDERS);
    case "network":
      return withOrg(FALLBACK_DETAILLANT_NETWORK);
    default:
      return { organizationId };
  }
}
