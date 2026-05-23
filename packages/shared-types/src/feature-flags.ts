export const VENEXT_FEATURE_KEYS = [
  "wallet",
  "payments",
  "qr",
  "nfc",
  "sponsored_products",
  "ephemeral_market",
  "ai",
  "logistics_tracking",
  "industrial_safety",
  "voice_messaging",
  "group_buying",
] as const;

export type VenextFeatureKey = (typeof VENEXT_FEATURE_KEYS)[number];

export type FeatureFlagDimension =
  | { type: "global" }
  | { type: "country"; iso3166: string }
  | { type: "region"; code: string }
  | { type: "role_facet"; facet: string }
  | { type: "company"; organizationId: string }
  | { type: "user"; userId: string };
