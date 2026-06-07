import type { TerrainProfileId } from "./types.js";
import { fromApiProfileId } from "./types.js";

export type TerrainProfileContextInput = {
  userId: string;
  activeProfile: TerrainProfileId | null;
  profileContextId: string;
  profileSessionVersion?: number;
  resourceProfile?: TerrainProfileId | null;
  action?: string;
  ordersMode?: string | null;
};

export type TerrainProfileContextDecision =
  | { ok: true }
  | { ok: false; code: string; message: string };

export function assertTerrainProfileContext(input: TerrainProfileContextInput): TerrainProfileContextDecision {
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
  if (input.action === "owner_catalog" && input.activeProfile === "detaillant") {
    return {
      ok: false,
      code: "catalog_owner_forbidden",
      message: "Catalogue propriétaire indisponible en mode détaillant.",
    };
  }
  if (input.action === "wholesale_market" && input.activeProfile === "detaillant") {
    return { ok: true };
  }
  if (input.action === "wholesale_market" && input.activeProfile !== "grossiste_b") {
    return { ok: false, code: "market_profile_mismatch", message: "Marché grossiste requis." };
  }
  return { ok: true };
}

export function parseActiveProfileHeader(value: string | undefined): TerrainProfileId | null {
  if (!value) return null;
  return fromApiProfileId(value);
}

export function parseProfileSessionVersionHeader(value: string | undefined): number | undefined {
  if (!value?.trim()) return undefined;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : undefined;
}
