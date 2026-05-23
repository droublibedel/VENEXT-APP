import type { VenextActorRole, VenextAuthSession } from "./venext-auth.types";
import { isSessionExpired } from "./venext-auth-security.guard";
import { SESSION_TTL_MS } from "./venext-auth.types";
import type { WalletSecurityContextInput } from "./venext-wallet-security.types";
import { resolveWalletSecurityMode } from "./venext-wallet-security-mode";
import { readWalletSecurityState } from "./venext-wallet-security-persistence";

export function isTerrainUnlimitedSession(
  input: WalletSecurityContextInput,
): boolean {
  const resolution = resolveWalletSecurityMode({
    ...input,
    persistenceMode: input.persistenceMode ?? readWalletSecurityState().persistenceMode,
  });
  return resolution.unlimitedTerrainSession && resolution.mode === "LIGHT_COMMERCE_MODE";
}

export function isAuthSessionExpiredForContext(
  session: VenextAuthSession | null,
  input: WalletSecurityContextInput,
  now = Date.now(),
): boolean {
  if (!session) return true;
  if (isTerrainUnlimitedSession(input)) return false;
  return isSessionExpired(session, now);
}

export function createSessionExpiryIso(
  actorRole: VenextActorRole,
  input: WalletSecurityContextInput,
  now = Date.now(),
): string {
  if (isTerrainUnlimitedSession({ ...input, actorRole })) {
    return new Date(now + 100 * 365 * 24 * 60 * 60 * 1000).toISOString();
  }
  return new Date(now + SESSION_TTL_MS).toISOString();
}

export function parseWalletBalanceFcfa(input: number | string | undefined | null): number {
  if (typeof input === "number" && Number.isFinite(input)) return Math.max(0, input);
  if (!input) return 0;
  const digits = String(input).replace(/\D/g, "");
  if (!digits) return 0;
  return Number.parseInt(digits, 10) || 0;
}
