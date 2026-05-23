import type {
  GrossisteACatalogDto,
  GrossisteADistributionDto,
  GrossisteAFinanceDto,
  GrossisteAIntelligenceDto,
  GrossisteAMapDto,
  GrossisteANetworkDto,
  GrossisteAOrdersDto,
  GrossisteAOverviewDto,
  GrossisteATerritoryDto,
} from "../hooks/grossiste-a-data.types";

export const GROSSISTE_A_ORG_ID = "org-grossiste-a-demo";

export const GROSSISTE_A_REGIONS: GrossisteAMapDto["regions"] = [
  { id: "abidjan", name: "Abidjan", lat: 5.36, lng: -4.01, wholesalers: 42, retailers: 280, orderVolume7d: 18400, growthPct: 14.2, tension: "medium" },
  { id: "bouake", name: "Bouaké", lat: 7.69, lng: -5.03, wholesalers: 18, retailers: 120, orderVolume7d: 9200, growthPct: 11.5, tension: "medium" },
  { id: "korhogo", name: "Korhogo", lat: 9.45, lng: -5.63, wholesalers: 12, retailers: 85, orderVolume7d: 6100, growthPct: 16.8, tension: "low" },
  { id: "sanpedro", name: "San Pedro", lat: 4.75, lng: -6.64, wholesalers: 10, retailers: 62, orderVolume7d: 4800, growthPct: 9.2, tension: "low" },
  { id: "yamoussoukro", name: "Yamoussoukro", lat: 6.82, lng: -5.28, wholesalers: 14, retailers: 95, orderVolume7d: 7200, growthPct: 10.1, tension: "low" },
  { id: "man", name: "Man", lat: 7.4, lng: -7.55, wholesalers: 8, retailers: 48, orderVolume7d: 3200, growthPct: 8.4, tension: "low" },
];

const BASE_MAP: GrossisteAMapDto = {
  regions: GROSSISTE_A_REGIONS,
  corridors: [
    { id: "c1", label: "Abidjan hub", tension: "medium" },
    { id: "c2", label: "Axe nord", tension: "medium" },
    { id: "c3", label: "Axe ouest", tension: "low" },
  ],
};

export function mockGrossisteAOverview(): GrossisteAOverviewDto {
  return {
    organizationId: GROSSISTE_A_ORG_ID,
    activityToday: 34,
    activeOrders: 12,
    activePartners: 28,
    dynamicCities: ["Abidjan", "Bouaké", "Korhogo"],
    movingProducts: [
      { id: "p1", name: "Huile 1L", category: "huile" },
      { id: "p2", name: "Riz 25kg", category: "riz" },
      { id: "p3", name: "Boisson pack", category: "boissons" },
    ],
    networkStability: "Stable",
    simpleAlerts: [
      { id: "a1", text: "5 commandes en validation" },
      { id: "a2", text: "Corridor nord actif" },
    ],
    visibleTrends: [
      { id: "t1", label: "Demande huile", direction: "up" },
      { id: "t2", label: "Couverture ouest", direction: "stable" },
    ],
  };
}

export function mockGrossisteANetwork(): GrossisteANetworkDto {
  return {
    organizationId: GROSSISTE_A_ORG_ID,
    activePartners: [
      { id: "pt1", name: "Distributeur Plateau", type: "détaillant", city: "Abidjan", orders7d: 8 },
      { id: "pt2", name: "Semi-grossiste Nord", type: "semi-grossiste", city: "Bouaké", orders7d: 5 },
    ],
    secondaryWholesalers: [
      { id: "sg1", name: "Grossiste secondaire Yop", city: "Abidjan" },
    ],
    activeRetailers: [
      { id: "rt1", name: "Boutique Korhogo", city: "Korhogo" },
      { id: "rt2", name: "Épicerie Yamoussoukro", city: "Yamoussoukro" },
    ],
    strongZones: ["Abidjan", "Korhogo"],
    weakZones: ["San Pedro"],
    networkActivity: "Dynamique",
    suggestions: ["Renforcer San Pedro", "Relancer partenaires Bouaké"],
  };
}

export function mockGrossisteAOrders(): GrossisteAOrdersDto {
  return {
    organizationId: GROSSISTE_A_ORG_ID,
    enCours: [
      { id: "o1", partner: "Distributeur Plateau", city: "Abidjan", status: "preparation", items: 24, amountLabel: "840 000 FCFA", updatedAt: "Aujourd'hui 09:00" },
      { id: "o2", partner: "Semi-grossiste Nord", city: "Bouaké", status: "validation", items: 18, amountLabel: "520 000 FCFA", updatedAt: "Aujourd'hui 08:15" },
    ],
    recent: [
      { id: "o3", partner: "Boutique Man", city: "Man", status: "livraison", items: 8, amountLabel: "112 000 FCFA", updatedAt: "Hier" },
      { id: "o4", partner: "Détaillant San Pedro", city: "San Pedro", status: "retard", items: 6, amountLabel: "68 000 FCFA", updatedAt: "Hier" },
    ],
  };
}

export function mockGrossisteADistribution(): GrossisteADistributionDto {
  return {
    organizationId: GROSSISTE_A_ORG_ID,
    map: BASE_MAP,
    activeCorridors: [
      { id: "c1", label: "Abidjan → Bouaké", level: "actif" },
      { id: "c2", label: "Axe nord", level: "modéré" },
    ],
    distributionTensions: [
      { id: "dt1", text: "Pression légère sur corridor ouest" },
    ],
    activeCities: ["Abidjan", "Bouaké", "Korhogo"],
    flowStability: "Stable",
    dynamicHubs: ["Abidjan hub", "Korhogo"],
  };
}

export function mockGrossisteACatalog(): GrossisteACatalogDto {
  return {
    organizationId: GROSSISTE_A_ORG_ID,
    products: [
      { id: "pr1", name: "Eau minérale pack", category: "boissons", availability: "Disponible", rotation: "Rapide", demand: "high", networkCoverage: "Large" },
      { id: "pr2", name: "Farine 50kg", category: "farine", availability: "Limité", rotation: "Moyenne", demand: "high", networkCoverage: "Nord" },
      { id: "pr3", name: "Riz 25kg", category: "riz", availability: "Disponible", rotation: "Rapide", demand: "high", networkCoverage: "National" },
      { id: "pr4", name: "Huile 1L", category: "huile", availability: "Disponible", rotation: "Rapide", demand: "normal", networkCoverage: "Large" },
      { id: "pr5", name: "Tomate conserve", category: "conserve", availability: "Disponible", rotation: "Moyenne", demand: "normal", networkCoverage: "Sud" },
      { id: "pr6", name: "Savon doux x24", category: "hygiène", availability: "Limité", rotation: "Lente", demand: "slow", networkCoverage: "Ouest" },
      { id: "pr7", name: "Produit importé premium", category: "produits importés", availability: "Disponible", rotation: "Moyenne", demand: "normal", networkCoverage: "Abidjan" },
    ],
  };
}

export function mockGrossisteATerritory(): GrossisteATerritoryDto {
  return {
    organizationId: GROSSISTE_A_ORG_ID,
    cityActivity: [
      { city: "Abidjan", level: "actif", growth: "+14%" },
      { city: "Bouaké", level: "modéré", growth: "+11%" },
      { city: "Korhogo", level: "actif", growth: "+17%" },
    ],
    growthZones: ["Korhogo", "Abidjan"],
    slowZones: ["San Pedro"],
    corridorActivity: [
      { id: "ca1", label: "Hub Abidjan" },
      { id: "ca2", label: "Nord Bouaké–Korhogo" },
    ],
    regionalPartners: [
      { id: "rp1", name: "Distributeur régional Nord", city: "Korhogo" },
    ],
  };
}

export function mockGrossisteAFinance(): GrossisteAFinanceDto {
  return {
    organizationId: GROSSISTE_A_ORG_ID,
    collectionStability: "Bonne",
    financialActivity: "Encaissements réguliers cette semaine",
    reliablePartners: [
      { id: "fp1", name: "Distributeur Plateau" },
      { id: "fp2", name: "Semi-grossiste Nord" },
    ],
    tensionZones: ["San Pedro"],
    revenueCoverage: "82% du réseau couvert",
  };
}

export function mockGrossisteAIntelligence(): GrossisteAIntelligenceDto {
  return {
    organizationId: GROSSISTE_A_ORG_ID,
    activitySignals: [
      { id: "s1", text: "Activité soutenue sur le corridor nord" },
      { id: "s2", text: "Demande huile en hausse" },
    ],
    watchZones: ["San Pedro", "Man"],
    dynamicProducts: ["Riz 25kg", "Eau minérale pack"],
    activePartners: ["Distributeur Plateau", "Semi-grossiste Nord"],
    suggestions: [
      "Renforcer la couverture San Pedro",
      "Anticiper la demande riz sur Korhogo",
    ],
    anomalies: [
      { id: "an1", text: "Activité plus faible qu'habituellement à San Pedro" },
    ],
  };
}
