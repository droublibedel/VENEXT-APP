/** Mirrors `prisma/schema.prisma` — import runtime enums from `@prisma/client` in apps with DB access. */
export const PreferredLanguage = ["fr", "en", "ar", "zh"] as const;
export type PreferredLanguage = (typeof PreferredLanguage)[number];

export const DomainFeatureFlagKeys = [
  "wallet_enabled",
  "payments_enabled",
  "qr_enabled",
  "nfc_enabled",
  "sponsored_products_enabled",
  "group_buying_enabled",
  "ai_assistant_enabled",
  "industrial_safety_enabled",
  "edge_sync_enabled",
  "voice_messaging_enabled",
  /** Instruction 5 — industrial pole system */
  "industrial_poles_enabled",
  "logistics_map_enabled",
  "realtime_signals_enabled",
  "weather_signals_enabled",
  "sponsored_visibility_enabled",
] as const;
export type DomainFeatureFlagKey = (typeof DomainFeatureFlagKeys)[number];
