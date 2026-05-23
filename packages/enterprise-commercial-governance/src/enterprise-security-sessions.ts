import type { FormalSessionState } from "./enterprise-formal-session";
import { createFormalSession, revokeFormalSession } from "./enterprise-formal-session";

const sessions = new Map<string, FormalSessionState>();

export function registerFormalSession(input: Parameters<typeof createFormalSession>[0]): FormalSessionState {
  const session = createFormalSession(input);
  sessions.set(session.sessionId, session);
  return session;
}

export function listSessionsForEnterprise(enterpriseId: string): FormalSessionState[] {
  return [...sessions.values()].filter((s) => s.enterpriseId === enterpriseId);
}

export function listSessionsForUser(internalEnterpriseUserId: string): FormalSessionState[] {
  return [...sessions.values()].filter((s) => s.internalEnterpriseUserId === internalEnterpriseUserId);
}

export function invalidateSession(sessionId: string): FormalSessionState | undefined {
  const s = sessions.get(sessionId);
  if (!s) return undefined;
  const revoked = revokeFormalSession(s);
  sessions.set(sessionId, revoked);
  return revoked;
}

export function invalidateAllSessionsForUser(internalEnterpriseUserId: string): number {
  let count = 0;
  for (const [id, s] of sessions) {
    if (s.internalEnterpriseUserId === internalEnterpriseUserId) {
      sessions.set(id, revokeFormalSession(s));
      count += 1;
    }
  }
  return count;
}

export function invalidateAllSessionsForEnterprise(enterpriseId: string): number {
  let count = 0;
  for (const [id, s] of sessions) {
    if (s.enterpriseId === enterpriseId) {
      sessions.set(id, revokeFormalSession(s));
      count += 1;
    }
  }
  return count;
}

export function resetFormalSessionsStorage(): void {
  sessions.clear();
}
