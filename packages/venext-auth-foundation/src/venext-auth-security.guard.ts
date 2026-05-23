import type {
  VenextActorProfile,
  VenextActorRole,
  VenextAuthSession,
  VenextLocaleTag,
} from "./venext-auth.types";
import { assertActorMatch } from "./venext-auth-actor";
import { assertProfileMatchesActor } from "./venext-auth-profile";

export function maskPhoneNumber(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 4) return "••••";
  const tail = digits.slice(-4);
  return `••• •• ${tail}`;
}

export function isSessionExpired(
  session: VenextAuthSession | null,
  now = Date.now(),
  options?: { unlimitedTerrainSession?: boolean },
): boolean {
  if (!session) return true;
  if (options?.unlimitedTerrainSession) return false;
  return new Date(session.expiresAt).getTime() <= now;
}

export function validateSessionActor(
  session: VenextAuthSession | null,
  expectedRole: VenextActorRole,
  options?: { unlimitedTerrainSession?: boolean },
): { valid: boolean; reason?: string } {
  if (!session) return { valid: false, reason: "no-session" };
  if (isSessionExpired(session, Date.now(), options)) {
    return { valid: false, reason: "session-expired" };
  }
  if (!assertActorMatch(expectedRole, session.actorRole)) {
    return { valid: false, reason: "actor-mismatch" };
  }
  return { valid: true };
}

export function validateProfileCoherence(
  session: VenextAuthSession | null,
  profile: VenextActorProfile | null,
): { valid: boolean; reason?: string } {
  if (!session || !profile) return { valid: false, reason: "incomplete" };
  if (!assertProfileMatchesActor(session.actorRole, profile)) {
    return { valid: false, reason: "profile-actor-mismatch" };
  }
  return { valid: true };
}

export function validateLocaleCoherence(
  storedLocale: VenextLocaleTag | undefined,
  activeLocale: VenextLocaleTag | undefined,
): boolean {
  if (!storedLocale || !activeLocale) return true;
  return storedLocale === activeLocale;
}

export function validateFlagsCoherence(
  required: Record<string, boolean | undefined>,
  active: Record<string, boolean | undefined>,
): boolean {
  for (const [key, expected] of Object.entries(required)) {
    if (expected === undefined) continue;
    if (active[key] !== expected) return false;
  }
  return true;
}

export function sanitizeAuthErrorMessage(reason?: string): string {
  switch (reason) {
    case "session-expired":
      return "Votre session a expiré. Reconnectez-vous pour continuer votre activité.";
    case "actor-mismatch":
      return "Ce compte ne correspond pas à cette application.";
    case "profile-actor-mismatch":
      return "Profil incompatible avec votre espace commercial.";
    default:
      return "Connexion requise pour accéder à votre activité.";
  }
}
