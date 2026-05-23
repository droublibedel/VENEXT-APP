export type GrossisteADataSource = "live" | "fallback" | "mixed";

export type MapRegion = {
  id: string;
  name: string;
  lat: number;
  lng: number;
  wholesalers: number;
  retailers: number;
  orderVolume7d: number;
  growthPct: number;
  tension: "low" | "medium" | "high";
};

export type MapCorridor = { id: string; label: string; tension: "low" | "medium" | "high" };

export type GrossisteAMapDto = {
  regions: MapRegion[];
  corridors: MapCorridor[];
};

export type GrossisteAOverviewDto = {
  organizationId: string;
  activityToday: number;
  activeOrders: number;
  activePartners: number;
  dynamicCities: string[];
  movingProducts: { id: string; name: string; category: string }[];
  networkStability: string;
  simpleAlerts: { id: string; text: string }[];
  visibleTrends: { id: string; label: string; direction: string }[];
};

export type GrossisteANetworkDto = {
  organizationId: string;
  activePartners: { id: string; name: string; type: string; city: string; orders7d: number }[];
  secondaryWholesalers: { id: string; name: string; city: string }[];
  activeRetailers: { id: string; name: string; city: string }[];
  strongZones: string[];
  weakZones: string[];
  networkActivity: string;
  suggestions: string[];
};

export type GrossisteAOrderRow = {
  id: string;
  partner: string;
  city: string;
  status: "validation" | "preparation" | "livraison" | "retard";
  items: number;
  amountLabel: string;
  updatedAt: string;
};

export type GrossisteAOrdersDto = {
  organizationId: string;
  enCours: GrossisteAOrderRow[];
  recent: GrossisteAOrderRow[];
};

export type GrossisteADistributionDto = {
  organizationId: string;
  map: GrossisteAMapDto;
  activeCorridors: { id: string; label: string; level: string }[];
  distributionTensions: { id: string; text: string }[];
  activeCities: string[];
  flowStability: string;
  dynamicHubs: string[];
};

export type GrossisteAProduct = {
  id: string;
  name: string;
  category: string;
  availability: string;
  rotation: string;
  demand: "high" | "normal" | "slow";
  networkCoverage: string;
};

export type GrossisteACatalogDto = {
  organizationId: string;
  products: GrossisteAProduct[];
};

export type GrossisteATerritoryDto = {
  organizationId: string;
  cityActivity: { city: string; level: string; growth: string }[];
  growthZones: string[];
  slowZones: string[];
  corridorActivity: { id: string; label: string }[];
  regionalPartners: { id: string; name: string; city: string }[];
};

export type GrossisteAFinanceDto = {
  organizationId: string;
  collectionStability: string;
  financialActivity: string;
  reliablePartners: { id: string; name: string }[];
  tensionZones: string[];
  revenueCoverage: string;
};

export type GrossisteAIntelligenceDto = {
  organizationId: string;
  activitySignals: { id: string; text: string }[];
  watchZones: string[];
  dynamicProducts: string[];
  activePartners: string[];
  suggestions: string[];
  anomalies: { id: string; text: string }[];
};

export type GrossisteABffEndpoint =
  | "overview"
  | "network"
  | "orders"
  | "distribution"
  | "catalog"
  | "territory"
  | "finance"
  | "intelligence"
  | "settlements"
  | "messaging";

export type GrossisteAEnvelope<T> = {
  dataSource: GrossisteADataSource;
  fallbackUsed: boolean;
  organizationId: string;
  payload: T;
};

export type GrossisteALiveState<T> = {
  data: T | null;
  loading: boolean;
  error: string | null;
  dataSource: GrossisteADataSource;
  fallbackUsed: boolean;
  refresh: () => void;
};
