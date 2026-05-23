import { resolveFormalDisplayIdentity } from "commercial-network-discovery";

import type { ProfessionalPartner } from "./professional-commercial-network.types";

export function resolveProfessionalPartnerDisplay(partner: ProfessionalPartner) {
  const actorType = partner.activityType.toLowerCase().includes("producteur")
    ? "PRODUCER"
    : "GROSSISTE_A";
  return resolveFormalDisplayIdentity({
    actorId: partner.id,
    actorType,
    registeredBusinessName: partner.companyName,
    activityLabel: partner.activityType,
    city: partner.city,
    representativeName: partner.contactName,
    validationLabel:
      partner.status === "active"
        ? "Partenaire validé"
        : partner.status === "pending_validation"
          ? "En validation"
          : undefined,
  });
}
