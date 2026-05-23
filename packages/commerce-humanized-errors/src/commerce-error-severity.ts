import type { CommerceErrorKey, CommerceErrorSeverity } from "./commerce-humanized-errors.types";

const SEVERITY_BY_KEY: Record<CommerceErrorKey, CommerceErrorSeverity> = {
  network_unstable: "recoverable",
  connection_timeout: "recoverable",
  session_expired: "blocking",
  access_suspended: "blocking",
  access_denied: "warning",
  relation_inactive: "warning",
  wallet_locked: "info",
  otp_invalid: "warning",
  password_incorrect: "warning",
  load_failed: "recoverable",
  service_unavailable: "recoverable",
  catalog_unavailable: "warning",
  message_not_sent: "recoverable",
  delivery_unavailable: "warning",
  invalid_file: "warning",
  image_error: "warning",
  sync_failed: "recoverable",
  cache_error: "recoverable",
  not_found: "warning",
  server_error: "recoverable",
  runtime_error: "recoverable",
  unexpected: "recoverable",
  offline: "warning",
  wallet_action_failed: "warning",
  order_unavailable: "warning",
  generic: "recoverable",
};

export function severityForErrorKey(key: CommerceErrorKey): CommerceErrorSeverity {
  return SEVERITY_BY_KEY[key] ?? "recoverable";
}
