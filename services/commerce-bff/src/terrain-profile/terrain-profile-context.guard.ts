import type { Request } from "express";

import {
  normalizeTerrainProfileApiId,
  type TerrainProfileApiId,
} from "./terrain-profile-identity.logic.js";

export type TerrainProfileRequestContext = {
  userId: string;
  activeProfile: TerrainProfileApiId | null;
  profileContextId: string;
  profileSessionVersion?: number;
};

const serverSessionVersions = new Map<string, number>();

export function setServerProfileSessionVersion(userId: string, version: number): void {
  serverSessionVersions.set(userId, version);
}

export function parseActiveProfileHeader(value: string | undefined): TerrainProfileApiId | null {
  if (!value) return null;
  return normalizeTerrainProfileApiId(value);
}

export function parseProfileSessionVersionHeader(value: string | undefined): number | undefined {
  if (!value?.trim()) return undefined;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : undefined;
}

export function rejectStaleProfileSession(
  userId: string,
  requestVersion: number | undefined,
): boolean {
  if (requestVersion == null) return false;
  const serverVersion = serverSessionVersions.get(userId) ?? 0;
  return requestVersion < serverVersion;
}

export function assertTerrainProfileContext(input: {
  userId: string;
  activeProfile: TerrainProfileApiId | null;
  resourceProfile?: TerrainProfileApiId | null;
  action?: string;
}): { ok: true } | { ok: false; code: string; message: string } {
  if (!input.userId?.trim() || input.userId === "anonymous") {
    return { ok: false, code: "invalid_user", message: "Utilisateur terrain invalide." };
  }
  if (!input.activeProfile) {
    return { ok: false, code: "no_active_profile", message: "Aucun profil actif." };
  }
  if (input.resourceProfile && input.resourceProfile !== input.activeProfile) {
    return {
      ok: false,
      code: "profile_resource_mismatch",
      message: "Ressource incompatible avec le profil actif.",
    };
  }
  if (input.action === "owner_catalog" && input.activeProfile === "DETAILLANT") {
    return {
      ok: false,
      code: "catalog_owner_forbidden",
      message: "Catalogue propriétaire indisponible en mode détaillant.",
    };
  }
  return { ok: true };
}

export function extractTerrainProfileRequestContext(req: Request): TerrainProfileRequestContext {
  const userId =
    String(req.headers["x-venext-user-id"] ?? req.query.userKey ?? "").trim() || "anonymous";
  const activeProfile = parseActiveProfileHeader(String(req.headers["x-venext-active-profile"] ?? ""));
  const profileContextId = String(req.headers["x-venext-profile-context-id"] ?? userId);
  const profileSessionVersion = parseProfileSessionVersionHeader(
    String(req.headers["x-venext-profile-session-version"] ?? ""),
  );
  return { userId, activeProfile, profileContextId, profileSessionVersion };
}

export function guardTerrainProfileSwitchRequest(
  req: Request,
  userKey: string,
):
  | { ok: true; context: TerrainProfileRequestContext }
  | { ok: false; status: number; code: string; message: string } {
  const context = extractTerrainProfileRequestContext(req);

  if (context.userId !== "anonymous" && context.userId !== userKey) {
    return {
      ok: false,
      status: 403,
      code: "user_key_mismatch",
      message: "Identifiant utilisateur incohérent.",
    };
  }

  if (rejectStaleProfileSession(userKey, context.profileSessionVersion)) {
    return {
      ok: false,
      status: 409,
      code: "stale_profile_session",
      message: "Session profil obsolète — réalignement requis.",
    };
  }

  return { ok: true, context };
}

export function guardTerrainProfileRoute(
  req: Request,
  opts: {
    requiredProfile?: TerrainProfileApiId;
    resourceProfile?: TerrainProfileApiId | null;
    action?: string;
  } = {},
):
  | { ok: true; context: TerrainProfileRequestContext }
  | { ok: false; status: number; code: string; message: string } {
  const context = extractTerrainProfileRequestContext(req);

  if (rejectStaleProfileSession(context.userId, context.profileSessionVersion)) {
    return {
      ok: false,
      status: 409,
      code: "stale_profile_session",
      message: "Session profil obsolète — réalignement requis.",
    };
  }

  const decision = assertTerrainProfileContext({
    userId: context.userId,
    activeProfile: context.activeProfile,
    resourceProfile: opts.resourceProfile ?? opts.requiredProfile ?? null,
    action: opts.action,
  });

  if (!decision.ok) {
    return { ok: false, status: 403, code: decision.code, message: decision.message };
  }

  if (opts.requiredProfile && context.activeProfile !== opts.requiredProfile) {
    return {
      ok: false,
      status: 403,
      code: "profile_context_mismatch",
      message: "Profil actif incompatible avec cette route.",
    };
  }

  return { ok: true, context };
}
