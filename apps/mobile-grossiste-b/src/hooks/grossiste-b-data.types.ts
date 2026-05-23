export type GrossisteDataSource = "live" | "fallback" | "mixed";

export type ProductBadge = "forte-demande" | "rotation-rapide" | "stock-limite";

export type GrossisteActivityDto = {
  organizationId: string;
  networkActivityToday: number;
  newOrdersCount: number;
  activePartners: number;
  movingProducts: { id: string; name: string; category: string; momentum: string }[];
  simpleAlerts: { id: string; text: string; level: "info" | "watch" }[];
  activeCities: string[];
  discreetTrends: { id: string; label: string; direction: "up" | "down" | "stable" }[];
};

export type GrossisteCatalogProduct = {
  id: string;
  name: string;
  category: string;
  availability: "available" | "limited" | "out";
  priceLabel: string;
  badge?: ProductBadge;
  promotion?: string;
  city: string;
};

export type GrossisteCatalogDto = {
  organizationId: string;
  products: GrossisteCatalogProduct[];
  popularIds: string[];
  promotions: { id: string; label: string }[];
};

export type OrderStatus = "preparation" | "validation" | "delivery" | "done";

export type GrossisteOrderRow = {
  id: string;
  partner: string;
  city: string;
  status: OrderStatus;
  items: number;
  amountLabel: string;
  updatedAt: string;
  late: boolean;
};

export type GrossisteOrdersDto = {
  organizationId: string;
  received: GrossisteOrderRow[];
  sent: GrossisteOrderRow[];
};

export type GrossisteNetworkDto = {
  organizationId: string;
  recentPartners: {
    id: string;
    name: string;
    type: string;
    city: string;
    lastActive: string;
  }[];
  activePartners: { id: string; name: string; city: string; orders7d: number }[];
  activeCities: string[];
  corridorActivity: { id: string; label: string; level: "active" | "moderate" | "quiet" }[];
  simpleSuggestions: string[];
};

export type GrossisteProfileDto = {
  organizationId: string;
  commercialName: string;
  networkBadge: string;
  phone: string;
  recentActivity: string;
  cityCoverage: readonly string[];
  languages: string[];
  notificationsEnabled: boolean;
  availability: string;
  catalogVisible: boolean;
};

export type GrossisteBffEndpoint = "activity" | "catalog" | "orders" | "network" | "profile";

export type GrossisteEnvelope<T> = {
  dataSource: GrossisteDataSource;
  fallbackUsed: boolean;
  organizationId: string;
  payload: T;
};

export type GrossisteLiveState<T> = {
  data: T | null;
  loading: boolean;
  error: string | null;
  dataSource: GrossisteDataSource;
  fallbackUsed: boolean;
  refresh: () => void;
};
