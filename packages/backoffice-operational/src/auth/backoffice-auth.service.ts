import { getBackofficeAuditRepository } from "../repositories/backoffice-audit.repository.js";
import {
  generateBackofficeOtpCode,
  getBackofficeAuthRepository,
} from "../repositories/backoffice-auth.repository.js";
import type { BackofficeSession } from "../types/auth.types.js";

function defaultAllowedEmails(): string[] {
  const raw = process.env.VENEXT_BACKOFFICE_ALLOWED_EMAILS;
  if (raw?.trim()) {
    return raw.split(",").map((e) => e.trim().toLowerCase()).filter(Boolean);
  }
  return ["ops@venext.ci", "support@venext.ci", "admin@venext.ci"];
}

export function isBackofficeEmailAllowed(email: string): boolean {
  const normalized = email.trim().toLowerCase();
  return defaultAllowedEmails().includes(normalized);
}

export async function requestBackofficeCode(
  email: string,
): Promise<{ ok: true; devCode?: string } | { ok: false; code: string }> {
  const normalized = email.trim().toLowerCase();
  if (!isBackofficeEmailAllowed(normalized)) {
    return { ok: false, code: "email_not_allowed" };
  }
  const auth = getBackofficeAuthRepository();
  const code = generateBackofficeOtpCode();
  await auth.upsertOtpChallenge(normalized, code);
  await auth.recordAuthAttempt(normalized, "otp_request", true);
  const isDev = process.env.NODE_ENV !== "production";
  return isDev ? { ok: true, devCode: code } : { ok: true };
}

export async function verifyBackofficeCode(
  email: string,
  code: string,
): Promise<{ ok: true; session: BackofficeSession } | { ok: false; code: string }> {
  const normalized = email.trim().toLowerCase();
  const auth = getBackofficeAuthRepository();
  const verified = await auth.verifyOtpCode(normalized, code);
  if (!verified.ok) {
    await auth.recordAuthAttempt(normalized, "otp_verify", false);
    return verified;
  }
  await auth.recordAuthAttempt(normalized, "otp_verify", true);
  const session = await auth.createSession(normalized, `op_${normalized.split("@")[0]}`);
  await getBackofficeAuditRepository().append({
    actorEmail: normalized,
    actorId: session.operatorId,
    action: "backoffice_login",
    targetType: "session",
    targetId: session.token.slice(0, 12),
  });
  return { ok: true, session };
}

export async function resolveBackofficeSession(token: string | undefined): Promise<BackofficeSession | null> {
  return getBackofficeAuthRepository().resolveSession(token);
}

export async function logoutBackofficeSession(token: string | undefined): Promise<boolean> {
  const auth = getBackofficeAuthRepository();
  const session = await auth.resolveSession(token);
  if (session) {
    await getBackofficeAuditRepository().append({
      actorEmail: session.email,
      actorId: session.operatorId,
      action: "backoffice_logout",
      targetType: "session",
      targetId: session.token.slice(0, 12),
    });
  }
  return auth.deleteSession(token);
}
