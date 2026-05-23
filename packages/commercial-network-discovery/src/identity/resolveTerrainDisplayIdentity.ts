import type {
  DisplayIdentityMode,
  RecognitionReason,
  ResolveTerrainDisplayIdentityInput,
  TerrainDisplayIdentity,
  TerrainIdentityMode,
} from "./commercial-identity.types";

export function maskPhoneNumber(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 8) return phone;

  const countryCode = digits.length > 10 ? digits.slice(0, 3) : "";
  const national = countryCode ? digits.slice(3) : digits;
  if (national.length < 4) return phone;

  const prefix = national.slice(0, 2);
  const suffix = national.slice(-2);
  return countryCode ? `+${countryCode} ${prefix} ** ** ${suffix}` : `${prefix} ** ** ${suffix}`;
}

function joinSecondary(parts: Array<string | undefined>): string | undefined {
  const line = parts.filter((p) => p && p.trim().length > 0).join(" · ");
  return line.length > 0 ? line : undefined;
}

function resolveHumanDisplayName(input: ResolveTerrainDisplayIdentityInput): string | undefined {
  return (
    input.registeredDisplayName?.trim() ||
    input.registeredPersonalName?.trim() ||
    undefined
  );
}

function matchKindToReason(
  matchKind: ResolveTerrainDisplayIdentityInput["matchKind"],
  hasContact: boolean,
  activityDiscovery: boolean,
): RecognitionReason {
  if (activityDiscovery && !hasContact) return "ACTIVITY_MATCH";
  if (matchKind === "mutual") return "CONTACT_MUTUAL_MATCH";
  if (matchKind === "one_way") return "CONTACT_ONE_WAY_MATCH";
  if (matchKind === "activity_boosted") return "ACTIVITY_MATCH";
  return "UNKNOWN_CONTACT";
}

function resolveTerrainIdentityMode(
  hasContact: boolean,
  humanName: string | undefined,
  businessName: string | undefined,
  activityDiscovery: boolean,
): TerrainIdentityMode {
  if (hasContact) return "CONTACT_FIRST";
  if (humanName) return activityDiscovery ? "PSEUDO_FIRST" : "PSEUDO_FIRST";
  if (businessName) return "BUSINESS_SECONDARY";
  return "PSEUDO_FIRST";
}

export function resolveTerrainDisplayIdentity(
  input: ResolveTerrainDisplayIdentityInput,
): TerrainDisplayIdentity {
  const contactName = input.contactName?.trim();
  const humanName = resolveHumanDisplayName(input);
  const businessName = input.registeredBusinessName?.trim();
  const activityDiscovery = input.activityDiscovery === true;
  const hasContact = Boolean(contactName);
  const terrainIdentityMode = resolveTerrainIdentityMode(
    hasContact,
    humanName,
    businessName,
    activityDiscovery,
  );

  let displayName: string;
  let secondaryName: string | undefined;
  let displayMode: DisplayIdentityMode;

  if (contactName) {
    displayName = contactName;
    secondaryName = joinSecondary([businessName, input.activityLabel, input.city]);
    displayMode = "CONTACT_FIRST_IDENTITY";
  } else if (activityDiscovery && humanName) {
    displayName = humanName;
    secondaryName =
      joinSecondary([businessName, input.activityLabel, input.city, "Suggestion selon activité"]) ??
      joinSecondary(["Suggestion selon activité", input.activityLabel, input.city]);
    displayMode = "MIXED_DISCOVERY_IDENTITY";
  } else if (humanName) {
    displayName = humanName;
    secondaryName = joinSecondary([businessName, input.activityLabel, input.city]);
    displayMode = "PSEUDO_FIRST_IDENTITY";
  } else if (businessName) {
    displayName = businessName;
    secondaryName = joinSecondary([input.activityLabel, input.city]);
    displayMode = "PSEUDO_FIRST_IDENTITY";
  } else {
    displayName = maskPhoneNumber(input.phoneNumber);
    secondaryName = "Contact commercial potentiel";
    displayMode = "UNKNOWN_CONTACT_IDENTITY";
  }

  const recognitionReason = matchKindToReason(input.matchKind, hasContact, activityDiscovery);

  return {
    actorId: input.actorId,
    actorType: input.actorType,
    phoneNumber: input.phoneNumber,
    contactName,
    registeredDisplayName: humanName,
    registeredBusinessName: businessName,
    registeredPersonalName: input.registeredPersonalName?.trim(),
    activityLabel: input.activityLabel,
    city: input.city,
    profileImageUrl: input.profileImageUrl,
    displayName,
    secondaryName,
    displayMode,
    recognitionReason,
    terrainIdentityMode,
    isLocalContactNamePrivate: true,
  };
}
