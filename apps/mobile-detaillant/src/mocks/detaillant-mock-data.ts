import type {
  DetaillantAccountDto,
  DetaillantHomeDto,
  DetaillantNetworkDto,
  DetaillantOrdersDto,
  DetaillantProductsDto,
} from "../hooks/detaillant-data.types";

export const DETAILLANT_CITIES = [
  "Abidjan",
  "Bouaké",
  "Korhogo",
  "Yamoussoukro",
  "San Pedro",
] as const;

export const DETAILLANT_ORG_ID = "org-detaillant-yopougon";

export function mockDetaillantHome(): DetaillantHomeDto {
  return {
    organizationId: DETAILLANT_ORG_ID,
    activityToday: 18,
    salesTodayLabel: "142 500 FCFA",
    popularProducts: [
      { id: "p1", name: "Eau 1.5L pack", category: "boissons" },
      { id: "p2", name: "Biscuits famille", category: "biscuits" },
      { id: "p3", name: "Huile 1L", category: "huile" },
    ],
    recentOrders: [
      { id: "o1", partner: "Grossiste Plateau", amountLabel: "28 400 FCFA", status: "En cours" },
      { id: "o2", partner: "Semi-grossiste Nord", amountLabel: "15 200 FCFA", status: "Reçue" },
    ],
    simpleAlerts: [
      { id: "a1", text: "2 commandes à suivre aujourd'hui" },
      { id: "a2", text: "Promo boissons jusqu'à ce soir" },
    ],
    activePartners: 8,
    discreetSuggestions: [
      "Renforcer le rayon boissons",
      "Vérifier le stock biscuits",
    ],
  };
}

export function mockDetaillantProducts(): DetaillantProductsDto {
  return {
    organizationId: DETAILLANT_ORG_ID,
    products: [
      {
        id: "pr1",
        name: "Eau minérale 1.5L x6",
        category: "boissons",
        availability: "available",
        priceLabel: "2 100 FCFA",
        badge: "tres-demande",
        city: "Abidjan",
      },
      {
        id: "pr2",
        name: "Biscuits assortis",
        category: "biscuits",
        availability: "available",
        priceLabel: "750 FCFA",
        badge: "disponible",
        promotion: "-10% aujourd'hui",
        city: "Abidjan",
      },
      {
        id: "pr3",
        name: "Huile 1L",
        category: "huile",
        availability: "limited",
        priceLabel: "1 180 FCFA",
        badge: "stock-limite",
        city: "Bouaké",
      },
      {
        id: "pr4",
        name: "Riz 5kg",
        category: "riz",
        availability: "available",
        priceLabel: "3 400 FCFA",
        badge: "tres-demande",
        city: "Korhogo",
      },
      {
        id: "pr5",
        name: "Sucre 1kg",
        category: "sucre",
        availability: "available",
        priceLabel: "650 FCFA",
        badge: "disponible",
        city: "Yamoussoukro",
      },
      {
        id: "pr6",
        name: "Savon doux",
        category: "savon",
        availability: "limited",
        priceLabel: "420 FCFA",
        badge: "stock-limite",
        city: "San Pedro",
      },
    ],
    popularIds: ["pr1", "pr2", "pr4"],
    promotions: [
      { id: "promo1", label: "Pack boissons — prix réseau Abidjan" },
      { id: "promo2", label: "Biscuits — offre matinée" },
    ],
  };
}

export function mockDetaillantOrders(): DetaillantOrdersDto {
  return {
    organizationId: DETAILLANT_ORG_ID,
    enCours: [
      {
        id: "c1",
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
        id: "r1",
        partner: "Semi-grossiste Nord",
        city: "Bouaké",
        status: "recue",
        items: 4,
        amountLabel: "15 200 FCFA",
        updatedAt: "Aujourd'hui 08:00",
      },
      {
        id: "r2",
        partner: "Grossiste Korhogo",
        city: "Korhogo",
        status: "livraison",
        items: 8,
        amountLabel: "42 000 FCFA",
        updatedAt: "Hier 17:30",
      },
    ],
    terminees: [
      {
        id: "t1",
        partner: "Boutique voisine",
        city: "Abidjan",
        status: "terminee",
        items: 3,
        amountLabel: "8 900 FCFA",
        updatedAt: "Hier 14:00",
      },
    ],
  };
}

export function mockDetaillantNetwork(): DetaillantNetworkDto {
  return {
    organizationId: DETAILLANT_ORG_ID,
    activeSuppliers: [
      { id: "s1", name: "Grossiste Plateau", type: "grossiste", city: "Abidjan" },
      { id: "s2", name: "Semi-grossiste Nord", type: "semi-grossiste", city: "Bouaké" },
    ],
    newPartners: [
      { id: "n1", name: "Boutique Marcory", city: "Abidjan", since: "Cette semaine" },
    ],
    cityActivity: [
      { city: "Abidjan", level: "active" },
      { city: "Bouaké", level: "moderate" },
      { city: "Korhogo", level: "active" },
    ],
    trendingProducts: [
      { id: "tp1", name: "Eau 1.5L", note: "Très demandé" },
      { id: "tp2", name: "Biscuits", note: "Rotation rapide" },
    ],
    networkSuggestions: [
      "Commander huile avant rupture",
      "Votre grossiste Plateau est actif",
    ],
  };
}

export function mockDetaillantAccount(): DetaillantAccountDto {
  return {
    organizationId: DETAILLANT_ORG_ID,
    shopName: "Boutique Étoile — Plateau",
    phone: "+225 07 11 22 33 44",
    city: "Abidjan",
    recentActivity: "8 ventes cette semaine",
    language: "Français",
    notificationsEnabled: true,
    activityVisible: true,
    availability: "Ouvert",
  };
}
