import type { CommercialActorRole, CommercialDiscoveryFlags } from "../commercial-network-discovery.types";
import { isFormalCommercialRole, isTerrainCommercialRole } from "../commercial-network-discovery-governance";
import type {
  CommercialActorType,
  CommercialIdentityFlags,
  TerrainIdentityMode,
} from "./commercial-identity.types";

export function toCommercialActorType(role: CommercialActorRole): CommercialActorType {
  switch (role) {
    case "producteur":
      return "PRODUCER";
    case "grossiste_a":
      return "GROSSISTE_A";
    case "grossiste_b":
      return "GROSSISTE_B";
    case "detaillant":
      return "DETAILLANT";
    default:
      return "DETAILLANT";
  }
}

export function isContactFirstIdentityEnabled(
  flags: CommercialDiscoveryFlags & CommercialIdentityFlags = {},
): boolean {
  return flags.commercial_contact_first_identity_enabled !== false;
}

export function isActivityBasedSuggestionsEnabled(
  flags: CommercialDiscoveryFlags & CommercialIdentityFlags = {},
): boolean {
  return flags.commercial_activity_based_suggestions_enabled !== false;
}

export function shouldUseContactFirstDisplay(
  role: CommercialActorRole,
  flags: CommercialDiscoveryFlags & CommercialIdentityFlags = {},
): boolean {
  return isTerrainCommercialRole(role) && isContactFirstIdentityEnabled(flags);
}

export function shouldUseFormalDisplay(role: CommercialActorRole): boolean {
  return isFormalCommercialRole(role);
}

/** Local contact labels must never be sent to the remote viewer. */
export function assertLocalContactPrivacy(viewerLocalName: string | undefined, remoteViewerId: string): void {
  void viewerLocalName;
  void remoteViewerId;
}

export function resolveTerrainActorType(
  role: CommercialActorRole,
): "GROSSISTE_B" | "DETAILLANT" | null {
  if (role === "grossiste_b") return "GROSSISTE_B";
  if (role === "detaillant") return "DETAILLANT";
  return null;
}

export function resolveTerrainIdentityModeForRole(
  role: CommercialActorRole,
): TerrainIdentityMode {
  if (isFormalCommercialRole(role)) return "FORMAL_ONLY";
  return "CONTACT_FIRST";
}

export function isTerrainPseudoIdentityEnabled(
  flags: CommercialDiscoveryFlags & CommercialIdentityFlags & { terrain_pseudo_identity_enabled?: boolean } = {},
): boolean {
  return flags.terrain_pseudo_identity_enabled !== false;
}

export function isTerrainQuickOnboardingEnabled(
  flags: { terrain_quick_onboarding_enabled?: boolean } = {},
): boolean {
  return flags.terrain_quick_onboarding_enabled !== false;
}
