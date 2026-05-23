export type BackofficeErrorType =
  | "connection_error"
  | "otp_invalid"
  | "password_incorrect"
  | "session_expired"
  | "network_unstable"
  | "api_unavailable"
  | "catalog_unavailable"
  | "image_error"
  | "order_unavailable"
  | "service_unavailable"
  | "wallet_action_failed"
  | "order_not_created"
  | "order_blocked"
  | "delivery_not_confirmed"
  | "message_not_sent"
  | "wallet_locked"
  | "wallet_not_activated"
  | "settlement_failed"
  | "invalid_file"
  | "upload_failed"
  | "invitation_expired"
  | "enterprise_link_invalid"
  | "access_suspended"
  | "unauthorized_access"
  | "frontend_runtime"
  | "backend_error"
  | "bff_error"
  | "offline_sync_error"
  | "generic";

export type BackofficeErrorSeverity = "info" | "warning" | "error" | "critical";

export type BackofficeErrorTreatmentStatus =
  | "NEW"
  | "ACKNOWLEDGED"
  | "IN_PROGRESS"
  | "RESOLVED"
  | "IGNORED";

export type BackofficeErrorEvent = {
  id: string;
  occurredAt: string;
  userId?: string;
  userPhone?: string;
  userEmail?: string;
  actorId?: string;
  actorRole?: string;
  application: string;
  screen?: string;
  action?: string;
  userFacingMessage: string;
  technicalMessage: string;
  internalStack?: string;
  errorType: BackofficeErrorType;
  severity: BackofficeErrorSeverity;
  treatmentStatus: BackofficeErrorTreatmentStatus;
  commercialContext?: Record<string, unknown>;
  device?: string;
  userAgent?: string;
  networkHint?: string;
  routeOrApi?: string;
  module?: string;
  journeyId?: string;
};
