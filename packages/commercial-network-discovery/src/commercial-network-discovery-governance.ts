import type {
  CommercialActorRole,
  CommercialDiscoveryFlags,
  CommercialDiscoveryGovernance,
} from "./commercial-network-discovery.types";

const TERRAIN_ROLES: CommercialActorRole[] = ["grossiste_b", "detaillant"];
const FORMAL_ROLES: CommercialActorRole[] = ["producteur", "grossiste_a"];

export function isTerrainCommercialRole(role: CommercialActorRole): boolean {
  return TERRAIN_ROLES.includes(role);
}

export function isFormalCommercialRole(role: CommercialActorRole): boolean {
  return FORMAL_ROLES.includes(role);
}

export function resolveCommercialDiscoveryGovernance(
  role: CommercialActorRole,
  flags: CommercialDiscoveryFlags = {},
): CommercialDiscoveryGovernance {
  const terrain = isTerrainCommercialRole(role);
  const discoveryOff = flags.commercial_network_discovery_enabled === false;

  if (discoveryOff) {
    return {
      autoAcceptCommercialConnections: false,
      contactSyncEnabled: false,
      catalogVisibleAfterConnection: false,
      autoPartnerSuggestions: false,
      restrictedPartnerMode: true,
      terrainMode: terrain,
      notice: "Découverte réseau — non activée pour cet environnement.",
    };
  }

  if (terrain) {
    const autoAccept =
      flags.commercial_auto_accept_enabled !== false;
    return {
      autoAcceptCommercialConnections: autoAccept,
      contactSyncEnabled: true,
      catalogVisibleAfterConnection: true,
      autoPartnerSuggestions: true,
      restrictedPartnerMode: false,
      terrainMode: true,
    };
  }

  return {
    autoAcceptCommercialConnections: false,
    contactSyncEnabled: false,
    catalogVisibleAfterConnection: true,
    autoPartnerSuggestions: false,
    restrictedPartnerMode: true,
    terrainMode: false,
    notice: "Relations formelles — validation explicite requise.",
  };
}
