import type {
  GrossisteActivityDto,
  GrossisteCatalogDto,
  GrossisteNetworkDto,
  GrossisteOrdersDto,
  GrossisteProfileDto,
} from "../hooks/grossiste-b-data.types";

export const GROSSISTE_B_CITIES = [
  "Abidjan",
  "Bouaké",
  "Yamoussoukro",
  "Korhogo",
  "San Pedro",
] as const;

export const GROSSISTE_B_ORG_ID = "org-grossiste-b-demo";

export function mockGrossisteActivity(): GrossisteActivityDto {
  return {
    organizationId: GROSSISTE_B_ORG_ID,
    networkActivityToday: 24,
    newOrdersCount: 7,
    activePartners: 12,
    movingProducts: [
      { id: "p1", name: "Huile 1L", category: "huile", momentum: "up" },
      { id: "p2", name: "Riz 25kg", category: "riz", momentum: "up" },
      { id: "p3", name: "Eau minérale pack", category: "boissons", momentum: "stable" },
    ],
    simpleAlerts: [
      { id: "a1", text: "3 commandes à valider ce matin", level: "info" },
      { id: "a2", text: "Stock limité sur farine 50kg", level: "watch" },
    ],
    activeCities: ["Abidjan", "Bouaké", "Korhogo"],
    discreetTrends: [
      { id: "t1", label: "Demande boissons", direction: "up" },
      { id: "t2", label: "Corridor nord", direction: "stable" },
    ],
  };
}

export function mockGrossisteCatalog(): GrossisteCatalogDto {
  return {
    organizationId: GROSSISTE_B_ORG_ID,
    products: [
      {
        id: "pr1",
        name: "Eau minérale 1.5L x12",
        category: "boissons",
        availability: "available",
        priceLabel: "4 200 FCFA",
        badge: "forte-demande",
        city: "Abidjan",
      },
      {
        id: "pr2",
        name: "Farine 50kg",
        category: "farine",
        availability: "limited",
        priceLabel: "18 500 FCFA",
        badge: "stock-limite",
        city: "Bouaké",
      },
      {
        id: "pr3",
        name: "Huile végétale 1L",
        category: "huile",
        availability: "available",
        priceLabel: "1 150 FCFA",
        badge: "rotation-rapide",
        city: "Abidjan",
      },
      {
        id: "pr4",
        name: "Riz local 25kg",
        category: "riz",
        availability: "available",
        priceLabel: "12 800 FCFA",
        badge: "forte-demande",
        promotion: "-5% réseau",
        city: "Yamoussoukro",
      },
      {
        id: "pr5",
        name: "Tomate concentrée",
        category: "conserve",
        availability: "available",
        priceLabel: "890 FCFA",
        city: "San Pedro",
      },
      {
        id: "pr6",
        name: "Savon doux x24",
        category: "hygiène",
        availability: "limited",
        priceLabel: "6 400 FCFA",
        badge: "stock-limite",
        city: "Korhogo",
      },
    ],
    popularIds: ["pr1", "pr3", "pr4"],
    promotions: [
      { id: "promo1", label: "Pack boissons — bonus livraison Abidjan" },
      { id: "promo2", label: "Riz 25kg — remise réseau Nord" },
    ],
  };
}

export function mockGrossisteOrders(): GrossisteOrdersDto {
  return {
    organizationId: GROSSISTE_B_ORG_ID,
    received: [
      {
        id: "o1",
        partner: "Boutique Plateau",
        city: "Abidjan",
        status: "preparation",
        items: 4,
        amountLabel: "84 200 FCFA",
        updatedAt: "Aujourd'hui 08:42",
        late: false,
      },
      {
        id: "o2",
        partner: "Semi-grossiste Nord",
        city: "Bouaké",
        status: "validation",
        items: 12,
        amountLabel: "312 000 FCFA",
        updatedAt: "Aujourd'hui 07:15",
        late: false,
      },
      {
        id: "o3",
        partner: "Détaillant Korhogo Centre",
        city: "Korhogo",
        status: "delivery",
        items: 6,
        amountLabel: "56 800 FCFA",
        updatedAt: "Hier 16:30",
        late: true,
      },
    ],
    sent: [
      {
        id: "s1",
        partner: "Fournisseur Agro Ouest",
        city: "San Pedro",
        status: "preparation",
        items: 20,
        amountLabel: "1 240 000 FCFA",
        updatedAt: "Aujourd'hui 06:00",
        late: false,
      },
    ],
  };
}

export function mockGrossisteNetwork(): GrossisteNetworkDto {
  return {
    organizationId: GROSSISTE_B_ORG_ID,
    recentPartners: [
      { id: "pt1", name: "Boutique Plateau", type: "détaillant", city: "Abidjan", lastActive: "Il y a 2 h" },
      { id: "pt2", name: "Semi-grossiste Nord", type: "semi-grossiste", city: "Bouaké", lastActive: "Ce matin" },
      { id: "pt3", name: "Épicerie Yamoussoukro", type: "boutique", city: "Yamoussoukro", lastActive: "Hier" },
    ],
    activePartners: [
      { id: "pt1", name: "Boutique Plateau", city: "Abidjan", orders7d: 5 },
      { id: "pt4", name: "Dépôt San Pedro", city: "San Pedro", orders7d: 3 },
    ],
    activeCities: ["Abidjan", "Bouaké", "Korhogo"],
    corridorActivity: [
      { id: "c1", label: "Abidjan → Bouaké", level: "active" },
      { id: "c2", label: "Axe nord Korhogo", level: "moderate" },
    ],
    simpleSuggestions: [
      "Relancer le détaillant Korhogo Centre",
      "Renforcer la présence boissons à Bouaké",
    ],
  };
}

export function mockGrossisteProfile(): GrossisteProfileDto {
  return {
    organizationId: GROSSISTE_B_ORG_ID,
    commercialName: "Grossiste — Réseau Ouest",
    networkBadge: "Partenaire actif",
    phone: "+225 07 00 00 00 00",
    recentActivity: "12 commandes cette semaine",
    cityCoverage: GROSSISTE_B_CITIES,
    languages: ["Français", "Dioula"],
    notificationsEnabled: true,
    availability: "Disponible",
    catalogVisible: true,
  };
}
