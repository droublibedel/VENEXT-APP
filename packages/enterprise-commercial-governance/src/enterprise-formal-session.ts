/** Session formelle Producteur / Grossiste A — distincte du mode terrain WhatsApp-like */

export type FormalSessionState = {
  sessionId: string;
  internalEnterpriseUserId: string;
  enterpriseId: string;
  poleId: string;
  createdAt: string;
  expiresAt: string;
  lastActivityAt: string;
  machineFingerprint?: string;
  locked: boolean;
};

const DEFAULT_SESSION_TTL_MS = 8 * 60 * 60 * 1000;
const INACTIVITY_LOCK_MS = 30 * 60 * 1000;

export function createFormalSession(input: {
  internalEnterpriseUserId: string;
  enterpriseId: string;
  poleId: string;
  machineFingerprint?: string;
  ttlMs?: number;
}): FormalSessionState {
  const now = Date.now();
  return {
    sessionId: `fs-${now}-${Math.random().toString(36).slice(2, 10)}`,
    internalEnterpriseUserId: input.internalEnterpriseUserId,
    enterpriseId: input.enterpriseId,
    poleId: input.poleId,
    createdAt: new Date(now).toISOString(),
    expiresAt: new Date(now + (input.ttlMs ?? DEFAULT_SESSION_TTL_MS)).toISOString(),
    lastActivityAt: new Date(now).toISOString(),
    machineFingerprint: input.machineFingerprint,
    locked: false,
  };
}

export function touchFormalSession(session: FormalSessionState): FormalSessionState {
  return { ...session, lastActivityAt: new Date().toISOString(), locked: false };
}

export function assertFormalSessionValid(
  session: FormalSessionState,
  now = Date.now(),
  machineFingerprint?: string,
): { ok: boolean; reason?: "expired" | "locked" | "machine_mismatch" | "revoked" } {
  if (new Date(session.expiresAt).getTime() < now) return { ok: false, reason: "expired" };
  if (session.locked) return { ok: false, reason: "locked" };
  if (
    session.machineFingerprint &&
    machineFingerprint &&
    session.machineFingerprint !== machineFingerprint
  ) {
    return { ok: false, reason: "machine_mismatch" };
  }
  const idle = now - new Date(session.lastActivityAt).getTime();
  if (idle > INACTIVITY_LOCK_MS) return { ok: false, reason: "locked" };
  return { ok: true };
}

export function revokeFormalSession(session: FormalSessionState): FormalSessionState {
  return {
    ...session,
    expiresAt: new Date(0).toISOString(),
    locked: true,
  };
}

export function isFormalSessionDistinctFromTerrainMode(): true {
  return true;
}
