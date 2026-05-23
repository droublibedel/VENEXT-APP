/** Keys surfaced in the governance command center (Instruction 10). */
export const BACKOFFICE_GOVERNED_FLAG_KEYS = [
  "wallet_enabled",
  "payments_enabled",
  "qr_enabled",
  "nfc_enabled",
  "sponsored_products_enabled",
  "relationship_graph_enabled",
  "contact_sync_enabled",
  "qr_relationship_enabled",
  "commercial_identity_enabled",
  "industrial_poles_enabled",
  "industrial_safety_enabled",
  "ai_assistant_enabled",
  "group_buying_enabled",
  "voice_messaging_enabled",
  "provider_orange_enabled",
  "provider_wave_enabled",
  "provider_mtn_enabled",
  "transfer_enabled",
  "electronic_payment_enabled",
] as const;

export type BackofficeGovernedFlagKey = (typeof BACKOFFICE_GOVERNED_FLAG_KEYS)[number];

/** Downstream bounded contexts impacted when a flag is off (Instruction 10 §18). */
export const FLAG_AFFECTED_MODULES: Partial<Record<BackofficeGovernedFlagKey, string[]>> = {
  wallet_enabled: ["wallet_core", "transaction_engine", "payments"],
  payments_enabled: ["payments", "transaction_engine", "wallet_core"],
  qr_enabled: ["qr_commerce", "wallet_core"],
  nfc_enabled: ["nfc_commerce"],
  sponsored_products_enabled: ["relational_catalog", "sponsored_visibility"],
  relationship_graph_enabled: ["relational_commerce", "catalog_visibility"],
  contact_sync_enabled: ["relational_commerce", "contact_graph"],
  qr_relationship_enabled: ["relational_commerce"],
  commercial_identity_enabled: ["relational_commerce"],
  industrial_poles_enabled: ["industrial_poles", "web_industrial_nextjs"],
  industrial_safety_enabled: ["industrial_safety", "poles"],
  ai_assistant_enabled: ["commerce_messaging", "poles"],
  group_buying_enabled: ["group_buying", "product_commerce"],
  voice_messaging_enabled: ["commerce_messaging"],
};
