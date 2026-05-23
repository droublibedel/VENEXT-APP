import type { VenextActorRole } from "./venext-auth.types";
import { isFormalActor, isTerrainActor } from "./venext-auth-actor";
import type { FormalSecurityModel, TerrainSecurityModel, WalletSecurityModel } from "./venext-wallet-security.types";

export function resolveSecurityModelForActor(role: VenextActorRole): WalletSecurityModel {
  if (isFormalActor(role)) return "FORMAL_SECURITY_MODEL";
  if (isTerrainActor(role)) return "TERRAIN_SECURITY_MODEL";
  return "TERRAIN_SECURITY_MODEL";
}

export function isTerrainSecurityModel(model: WalletSecurityModel): model is TerrainSecurityModel {
  return model === "TERRAIN_SECURITY_MODEL";
}

export function isFormalSecurityModel(model: WalletSecurityModel): model is FormalSecurityModel {
  return model === "FORMAL_SECURITY_MODEL";
}

export function formalSessionRequiresStrongPassword(): boolean {
  return true;
}

export function formalSessionUsesProfessionalTimeout(): boolean {
  return true;
}

export function terrainAllowsUnlimitedSessionWhenLight(): boolean {
  return true;
}

export function terrainNeverUsesUnlimitedWhenSecured(): boolean {
  return true;
}
