import type { FormalDisplayIdentity, ResolveFormalDisplayIdentityInput } from "./commercial-identity.types";

const ACTOR_TYPE_LABEL: Record<FormalDisplayIdentity["actorType"], string> = {
  PRODUCER: "Producteur industriel",
  GROSSISTE_A: "Grossiste A",
};

export function resolveFormalDisplayIdentity(
  input: ResolveFormalDisplayIdentityInput,
): FormalDisplayIdentity {
  const business =
    input.registeredBusinessName?.trim() ||
    input.legalName?.trim() ||
    input.brandName?.trim() ||
    input.registeredPersonalName?.trim() ||
    "Partenaire commercial";

  const actorLabel = ACTOR_TYPE_LABEL[input.actorType];
  const secondaryParts = [
    actorLabel,
    input.city?.trim(),
    input.validationLabel?.trim() ?? input.legalStatus?.trim(),
    input.representativeName?.trim() && input.registeredBusinessName
      ? `Repr. ${input.representativeName.trim()}`
      : undefined,
    input.activityLabel?.trim(),
  ];

  return {
    actorId: input.actorId,
    actorType: input.actorType,
    registeredBusinessName: business,
    logoUrl: input.logoUrl,
    legalStatus: input.legalStatus,
    activityLabel: input.activityLabel,
    city: input.city,
    displayName: business,
    secondaryName: secondaryParts.filter(Boolean).join(" · ") || undefined,
    displayMode: "FORMAL_IDENTITY",
    recognitionReason: "FORMAL_VALIDATED_PARTNER",
  };
}
