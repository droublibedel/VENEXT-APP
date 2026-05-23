export type CommerceUxPlatform = "mobile" | "web";

export type CommerceUxActorKind = "terrain" | "formal";

export type CommerceEmptyStateKey =
  | "catalog"
  | "orders"
  | "notifications"
  | "deliveries"
  | "relations"
  | "messages"
  | "wallet"
  | "activity"
  | "offline"
  | "generic";

export type CommerceErrorStateKey =
  | "access_denied"
  | "wallet_inactive"
  | "session_locked"
  | "offline"
  | "relation_inactive"
  | "generic";

export type CommerceUxHarmonyFlags = {
  commerce_ux_harmony_enabled?: boolean;
  commerce_foundation_guardrails_enabled?: boolean;
  venext_i18n_enabled?: boolean;
  venext_rtl_enabled?: boolean;
};
