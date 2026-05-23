import type { CommerceErrorKey } from "./commerce-humanized-errors.types";

const TECHNICAL_PATTERNS: { pattern: RegExp; key: CommerceErrorKey }[] = [
  { pattern: /\b(network\s*error|failed to fetch|fetch failed|load failed)\b/i, key: "network_unstable" },
  { pattern: /\b(timeout|timed out|etimedout)\b/i, key: "connection_timeout" },
  { pattern: /\b(401|unauthorized|session expired|token expired)\b/i, key: "session_expired" },
  { pattern: /\b(suspended|account disabled)\b/i, key: "access_suspended" },
  { pattern: /\b(403|forbidden|access denied)\b/i, key: "access_denied" },
  { pattern: /\b(relation.*inactive|relationship.*removed)\b/i, key: "relation_inactive" },
  { pattern: /\b(wallet.*lock|secured session|pin required)\b/i, key: "wallet_locked" },
  { pattern: /\b(otp|verification code).*(invalid|wrong)\b/i, key: "otp_invalid" },
  { pattern: /\b(pin|password).*(mismatch|incorrect|wrong)\b/i, key: "password_incorrect" },
  { pattern: /\b(404|not found)\b/i, key: "not_found" },
  { pattern: /\b(500|502|503|504|internal server)\b/i, key: "server_error" },
  { pattern: /\b(offline|hors connexion)\b/i, key: "offline" },
  { pattern: /\b(catalog).*(unavailable|not available)\b/i, key: "catalog_unavailable" },
  { pattern: /\b(message).*(not sent|failed)\b/i, key: "message_not_sent" },
  { pattern: /\b(delivery).*(unavailable)\b/i, key: "delivery_unavailable" },
  { pattern: /\b(sync).*(fail|error)\b/i, key: "sync_failed" },
  { pattern: /\b(prisma|axios|unexpected token|syntaxerror)\b/i, key: "runtime_error" },
  {
    pattern: /\b(undefined|null|cannot read prop|typeerror|referenceerror)\b/i,
    key: "runtime_error",
  },
  { pattern: /\b(fraud|security violation|authentication failure|authentication failed)\b/i, key: "wallet_action_failed" },
  { pattern: /\b(transaction rejected|rejected|critical error)\b/i, key: "wallet_action_failed" },
  { pattern: /\b(payment failure|operation failed)\b/i, key: "wallet_action_failed" },
];

export function mapHttpStatusToErrorKey(status: number): CommerceErrorKey {
  if (status === 401) return "session_expired";
  if (status === 403) return "access_denied";
  if (status === 404) return "not_found";
  if (status >= 500) return "server_error";
  if (status >= 400) return "generic";
  return "generic";
}

export function mapRawMessageToErrorKey(raw: string): CommerceErrorKey {
  const text = raw.trim();
  if (!text) return "generic";

  const statusOnly = text.match(/^\s*(\d{3})\b/);
  if (statusOnly) {
    return mapHttpStatusToErrorKey(Number.parseInt(statusOnly[1]!, 10));
  }

  for (const { pattern, key } of TECHNICAL_PATTERNS) {
    if (pattern.test(text)) return key;
  }

  return "unexpected";
}

export function mapThrownErrorToErrorKey(error: unknown): CommerceErrorKey {
  if (typeof error === "number") return mapHttpStatusToErrorKey(error);
  if (typeof error === "string") return mapRawMessageToErrorKey(error);

  if (error && typeof error === "object") {
    const row = error as Record<string, unknown>;
    if (typeof row.status === "number") return mapHttpStatusToErrorKey(row.status);
    if (typeof row.statusCode === "number") return mapHttpStatusToErrorKey(row.statusCode);
    if (typeof row.code === "string") {
      const fromCode = mapRawMessageToErrorKey(row.code);
      if (fromCode !== "unexpected") return fromCode;
    }
    if (typeof row.userMessage === "string" && row.userMessage.trim()) {
      const sanitized = mapRawMessageToErrorKey(row.userMessage);
      if (sanitized !== "unexpected") return sanitized;
    }
    if (typeof row.message === "string") return mapRawMessageToErrorKey(row.message);
  }

  return "unexpected";
}
