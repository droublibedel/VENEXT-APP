import type {
  VenextActorProfile,
  VenextActorRole,
  VenextAuthSession,
  VenextAuthState,
  VenextGuardResult,
  VenextPermissionKey,
} from "./venext-auth.types";
import { isFormalActor, isTerrainActor } from "./venext-auth-actor";
import { hasPermission, type VenextPermissionContext } from "./venext-auth-permissions";
import { isTerrainProfileComplete, isFormalProfileComplete } from "./venext-auth-profile";
import {
  sanitizeAuthErrorMessage,
  validateProfileCoherence,
  validateSessionActor,
} from "./venext-auth-security.guard";

export function requireAuthenticatedActor(
  state: VenextAuthState,
  expectedRole: VenextActorRole,
): VenextGuardResult {
  const sessionCheck = validateSessionActor(state.session, expectedRole);
  if (!sessionCheck.valid) {
    return {
      allowed: false,
      reason: sessionCheck.reason,
      message: sanitizeAuthErrorMessage(sessionCheck.reason),
    };
  }
  const profileCheck = validateProfileCoherence(state.session, state.profile);
  if (!profileCheck.valid) {
    return {
      allowed: false,
      reason: profileCheck.reason,
      message: sanitizeAuthErrorMessage(profileCheck.reason),
    };
  }
  return { allowed: true };
}

export function requireFormalActor(
  state: VenextAuthState,
  expectedRole: VenextActorRole,
): VenextGuardResult {
  if (!isFormalActor(expectedRole)) {
    return { allowed: false, reason: "not-formal-actor", message: "Espace formel requis." };
  }
  const base = requireAuthenticatedActor(state, expectedRole);
  if (!base.allowed) return base;
  if (state.profile?.kind !== "formal" || !isFormalProfileComplete(state.profile)) {
    return { allowed: false, reason: "formal-profile-incomplete", message: "Complétez votre structure commerciale." };
  }
  return { allowed: true };
}

export function requireTerrainActor(
  state: VenextAuthState,
  expectedRole: VenextActorRole,
): VenextGuardResult {
  if (!isTerrainActor(expectedRole)) {
    return { allowed: false, reason: "not-terrain-actor", message: "Espace terrain requis." };
  }
  const base = requireAuthenticatedActor(state, expectedRole);
  if (!base.allowed) return base;
  if (state.profile?.kind !== "terrain" || !isTerrainProfileComplete(state.profile)) {
    return { allowed: false, reason: "terrain-profile-incomplete", message: "Terminez votre profil terrain." };
  }
  return { allowed: true };
}

export function requireRelationshipPermission(
  ctx: VenextPermissionContext,
  permission: VenextPermissionKey,
): VenextGuardResult {
  if (!hasPermission(ctx, permission)) {
    return {
      allowed: false,
      reason: "permission-denied",
      message: "Cette action n'est pas disponible pour votre relation commerciale.",
    };
  }
  return { allowed: true };
}

export function guardUxMessage(result: VenextGuardResult): string | null {
  if (result.allowed) return null;
  return result.message ?? sanitizeAuthErrorMessage(result.reason);
}
