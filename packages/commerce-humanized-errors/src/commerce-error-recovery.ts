import type {
  CommerceErrorKey,
  CommerceErrorRecoveryAction,
} from "./commerce-humanized-errors.types";

const RECOVERY_BY_KEY: Record<CommerceErrorKey, CommerceErrorRecoveryAction[]> = {
  network_unstable: ["check_internet", "retry", "later"],
  connection_timeout: ["retry", "check_internet", "later"],
  session_expired: ["continue", "back"],
  access_suspended: ["back", "later"],
  access_denied: ["back", "continue"],
  relation_inactive: ["back", "continue"],
  wallet_locked: ["continue", "back"],
  otp_invalid: ["retry", "back"],
  password_incorrect: ["retry", "back"],
  load_failed: ["retry", "back"],
  service_unavailable: ["retry", "later", "back"],
  catalog_unavailable: ["back", "retry"],
  message_not_sent: ["retry", "check_internet"],
  delivery_unavailable: ["back", "retry"],
  invalid_file: ["retry", "back"],
  image_error: ["retry", "back"],
  sync_failed: ["retry", "check_internet", "later"],
  cache_error: ["continue", "retry"],
  not_found: ["back", "retry"],
  server_error: ["retry", "later", "back"],
  runtime_error: ["retry", "back", "continue"],
  unexpected: ["retry", "back", "later"],
  offline: ["check_internet", "retry", "later"],
  wallet_action_failed: ["retry", "back", "later"],
  order_unavailable: ["back", "retry"],
  generic: ["retry", "back", "later"],
};

export function recoveryActionsForKey(key: CommerceErrorKey): CommerceErrorRecoveryAction[] {
  return RECOVERY_BY_KEY[key] ?? ["retry", "back"];
}

export function recoveryActionLabel(
  action: CommerceErrorRecoveryAction,
  locale = "fr-CI",
): string {
  const fr: Record<CommerceErrorRecoveryAction, string> = {
    retry: "Réessayer",
    back: "Retour",
    continue: "Continuer",
    check_internet: "Vérifier internet",
    later: "Reprendre plus tard",
  };
  const en: Partial<Record<CommerceErrorRecoveryAction, string>> = {
    retry: "Try again",
    back: "Go back",
    continue: "Continue",
    check_internet: "Check connection",
    later: "Try later",
  };
  if (locale.startsWith("en")) return en[action] ?? fr[action];
  return fr[action];
}
