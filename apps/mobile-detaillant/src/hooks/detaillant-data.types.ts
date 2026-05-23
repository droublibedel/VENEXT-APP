export type DetaillantDataSource = "live" | "fallback" | "mixed";

export type ProductBadge = "disponible" | "tres-demande" | "stock-limite";

export type DetaillantHomeDto = {
  organizationId: string;
  activityToday: number;
  salesTodayLabel: string;
  popularProducts: { id: string; name: string; category: string }[];
  recentOrders: { id: string; partner: string; amountLabel: string; status: string }[];
  simpleAlerts: { id: string; text: string }[];
  activePartners: number;
  discreetSuggestions: string[];
};

export type DetaillantProduct = {
  id: string;
  name: string;
  category: string;
  availability: "available" | "limited" | "out";
  priceLabel: string;
  badge?: ProductBadge;
  promotion?: string;
  city: string;
};

export type DetaillantProductsDto = {
  organizationId: string;
  products: DetaillantProduct[];
  popularIds: string[];
  promotions: { id: string; label: string }[];
};

export type OrderStatus = "en-cours" | "recue" | "livraison" | "terminee";

export type DetaillantOrderRow = {
  id: string;
  partner: string;
  city: string;
  status: OrderStatus;
  items: number;
  amountLabel: string;
  updatedAt: string;
};

export type DetaillantOrdersDto = {
  organizationId: string;
  enCours: DetaillantOrderRow[];
  recues: DetaillantOrderRow[];
  terminees: DetaillantOrderRow[];
};

export type DetaillantNetworkDto = {
  organizationId: string;
  activeSuppliers: { id: string; name: string; type: string; city: string }[];
  newPartners: { id: string; name: string; city: string; since: string }[];
  cityActivity: { city: string; level: "active" | "moderate" | "quiet" }[];
  trendingProducts: { id: string; name: string; note: string }[];
  networkSuggestions: string[];
};

export type DetaillantAccountDto = {
  organizationId: string;
  shopName: string;
  phone: string;
  city: string;
  recentActivity: string;
  language: string;
  notificationsEnabled: boolean;
  activityVisible: boolean;
  availability: string;
};

export type DetaillantBffEndpoint = "home" | "products" | "orders" | "network";

export type DetaillantEnvelope<T> = {
  dataSource: DetaillantDataSource;
  fallbackUsed: boolean;
  organizationId: string;
  payload: T;
};

export type DetaillantLiveState<T> = {
  data: T | null;
  loading: boolean;
  error: string | null;
  dataSource: DetaillantDataSource;
  fallbackUsed: boolean;
  refresh: () => void;
};
