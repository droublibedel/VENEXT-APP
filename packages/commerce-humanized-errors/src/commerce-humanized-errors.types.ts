export type CommerceErrorKey =
  | "network_unstable"
  | "connection_timeout"
  | "session_expired"
  | "access_suspended"
  | "access_denied"
  | "relation_inactive"
  | "wallet_locked"
  | "otp_invalid"
  | "password_incorrect"
  | "load_failed"
  | "service_unavailable"
  | "catalog_unavailable"
  | "message_not_sent"
  | "delivery_unavailable"
  | "invalid_file"
  | "image_error"
  | "sync_failed"
  | "cache_error"
  | "not_found"
  | "server_error"
  | "runtime_error"
  | "unexpected"
  | "offline"
  | "wallet_action_failed"
  | "order_unavailable"
  | "generic";

export type CommerceErrorSeverity = "info" | "warning" | "recoverable" | "blocking";

export type CommerceErrorRecoveryAction =
  | "retry"
  | "back"
  | "continue"
  | "check_internet"
  | "later";

export type HumanizedCommerceError = {
  key: CommerceErrorKey;
  message: string;
  title: string;
  severity: CommerceErrorSeverity;
  recovery: CommerceErrorRecoveryAction[];
  recoverable: boolean;
};

export type HumanizeErrorOptions = {
  locale?: string;
  module?: string;
  route?: string;
  actorRole?: string;
  fallbackKey?: CommerceErrorKey;
  /** Contexte optionnel pour observabilité back-office (Instruction BACKOFFICE-01). */
  backofficeReport?: {
    application: string;
    screen?: string;
    action?: string;
    userId?: string;
    userPhone?: string;
    userEmail?: string;
    actorId?: string;
    actorRole?: string;
  };
};

export type InternalCommerceErrorLog = {
  at: string;
  key: CommerceErrorKey;
  rawMessage: string;
  stack?: string;
  module?: string;
  route?: string;
  actorRole?: string;
  runtimeInfo?: Record<string, unknown>;
};
