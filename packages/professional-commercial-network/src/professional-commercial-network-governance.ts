import type {
  ProfessionalActorRole,
  ProfessionalNetworkFlags,
  ProfessionalNetworkGovernance,
} from "./professional-commercial-network.types";

const FORMAL_ROLES: ProfessionalActorRole[] = ["producteur", "grossiste_a"];

export function isProfessionalNetworkRole(role: string): role is ProfessionalActorRole {
  return FORMAL_ROLES.includes(role as ProfessionalActorRole);
}

export function resolveProfessionalNetworkGovernance(
  role: ProfessionalActorRole,
  flags: ProfessionalNetworkFlags = {},
): ProfessionalNetworkGovernance {
  const roleFlag =
    role === "producteur"
      ? flags.producer_partner_network_enabled
      : flags.grossiste_a_partner_network_enabled;
  const globalOff =
    flags.professional_commercial_network_enabled === false || roleFlag === false;

  if (globalOff) {
    return {
      invitationRequired: true,
      validationRequired: true,
      restrictedCatalog: true,
      documentExchangeAllowed: false,
      territoryControlled: true,
      directMailAllowed: false,
      autoAcceptForbidden: true,
      notice: "Réseau commercial professionnel — non activé pour cet environnement.",
    };
  }

  return {
    invitationRequired: true,
    validationRequired: true,
    restrictedCatalog: true,
    documentExchangeAllowed: true,
    territoryControlled: true,
    directMailAllowed: true,
    autoAcceptForbidden: true,
  };
}
