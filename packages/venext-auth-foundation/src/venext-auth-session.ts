import type { VenextActorRole, VenextAuthMode, VenextAuthSession } from "./venext-auth.types";
import { SESSION_TTL_MS } from "./venext-auth.types";
import { isSessionExpired } from "./venext-auth-security.guard";

export function createSessionId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `sess_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

export function createAuthSession(
  actorRole: VenextActorRole,
  authMode: VenextAuthMode,
  now = Date.now(),
  options?: { unlimitedTerrainSession?: boolean },
): VenextAuthSession {
  const createdAt = new Date(now).toISOString();
  const expiresAt = options?.unlimitedTerrainSession
    ? new Date(now + 100 * 365 * 24 * 60 * 60 * 1000).toISOString()
    : new Date(now + SESSION_TTL_MS).toISOString();
  return {
    version: 1,
    sessionId: createSessionId(),
    actorRole,
    authMode,
    createdAt,
    expiresAt,
    lastActiveAt: createdAt,
  };
}

export function touchSession(session: VenextAuthSession, now = Date.now()): VenextAuthSession {
  return {
    ...session,
    lastActiveAt: new Date(now).toISOString(),
    expiresAt: new Date(now + SESSION_TTL_MS).toISOString(),
  };
}

export function refreshSessionLocally(
  session: VenextAuthSession | null,
  options?: { unlimitedTerrainSession?: boolean },
): VenextAuthSession | null {
  if (!session || isSessionExpired(session, Date.now(), options)) return null;
  if (options?.unlimitedTerrainSession) return session;
  return touchSession(session);
}

export function isActiveSession(
  session: VenextAuthSession | null,
  expectedRole?: VenextActorRole,
  options?: { unlimitedTerrainSession?: boolean },
): boolean {
  if (!session || isSessionExpired(session, Date.now(), options)) return false;
  if (expectedRole && session.actorRole !== expectedRole) return false;
  return true;
}

export function assertSingleActiveSession(
  current: VenextAuthSession | null,
  incoming: VenextAuthSession,
): boolean {
  if (!current) return true;
  return current.sessionId === incoming.sessionId && current.actorRole === incoming.actorRole;
}
