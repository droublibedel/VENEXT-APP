import type {
  CommercialActorRole,
  CommercialContactSuggestion,
  CommercialDiscoveryFlags,
  CommercialDiscoveryView,
  DisplayIdentityMode,
} from "../commercial-network-discovery.types";
import {
  isActivityBasedSuggestionsEnabled,
  isContactFirstIdentityEnabled,
  resolveTerrainActorType,
} from "./commercial-identity-governance";
import { recognitionReasonToBadge } from "./commercial-identity-intelligence";
import { resolveTerrainDisplayIdentity } from "./resolveTerrainDisplayIdentity";
import type { CommercialIdentityFlags } from "./commercial-identity.types";

export function initialsFromDisplayName(name: string): string {
  const parts = name.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  const first = parts[0] ?? "";
  if (parts.length === 1) return first.slice(0, 2).toUpperCase();
  const second = parts[1] ?? "";
  return `${first[0] ?? ""}${second[0] ?? ""}`.toUpperCase();
}

export function applyTerrainIdentityToSuggestion(
  suggestion: CommercialContactSuggestion,
  actorRole: CommercialActorRole,
  flags: CommercialDiscoveryFlags & CommercialIdentityFlags = {},
): CommercialContactSuggestion {
  const terrainType = resolveTerrainActorType(actorRole);
  if (!terrainType || !isContactFirstIdentityEnabled(flags)) {
    return suggestion;
  }

  const activityDiscovery =
    isActivityBasedSuggestionsEnabled(flags) &&
    !suggestion.localContactName &&
    suggestion.matchKind === "activity_boosted";

  const identity = resolveTerrainDisplayIdentity({
    actorId: suggestion.id,
    actorType: terrainType,
    phoneNumber: suggestion.phone,
    contactName: suggestion.localContactName,
    registeredDisplayName:
      suggestion.registeredDisplayName ?? suggestion.registeredPersonalName,
    registeredBusinessName: suggestion.registeredBusinessName,
    registeredPersonalName: suggestion.registeredPersonalName,
    activityLabel: suggestion.activityLabel,
    city: suggestion.city,
    matchKind: suggestion.matchKind,
    activityDiscovery,
  });

  return {
    ...suggestion,
    displayName: identity.displayName,
    secondaryName: identity.secondaryName,
    displayMode: identity.displayMode as DisplayIdentityMode,
    recognitionReason: identity.recognitionReason,
    recognitionHint: recognitionReasonToBadge(identity.recognitionReason, identity.displayMode),
    photoInitials: initialsFromDisplayName(identity.displayName),
  };
}

export function applyTerrainIdentityToView(
  view: CommercialDiscoveryView,
  actorRole: CommercialActorRole,
  flags: CommercialDiscoveryFlags & CommercialIdentityFlags = {},
): CommercialDiscoveryView {
  return {
    ...view,
    suggestions: view.suggestions.map((s) => applyTerrainIdentityToSuggestion(s, actorRole, flags)),
    connected: view.connected.map((c) => {
      const terrainType = resolveTerrainActorType(actorRole);
      if (!terrainType || !isContactFirstIdentityEnabled(flags)) return c;
      const identity = resolveTerrainDisplayIdentity({
        actorId: c.id,
        actorType: terrainType,
        phoneNumber: c.phone,
        contactName: c.localContactName,
        registeredBusinessName: c.registeredBusinessName ?? c.displayName,
        activityLabel: c.activityType,
        city: c.city,
        matchKind: "mutual",
      });
      return {
        ...c,
        displayName: identity.displayName,
        secondaryName: identity.secondaryName,
      };
    }),
  };
}

/** Viewer-local display for messaging — never exposes localContactName to remote party. */
export function resolveTerrainPartnerDisplayName(input: {
  partnerId: string;
  phone: string;
  localContactName?: string;
  registeredBusinessName?: string;
  registeredPersonalName?: string;
  activityLabel?: string;
  city?: string;
  actorRole: "grossiste_b" | "detaillant";
  flags?: CommercialDiscoveryFlags & CommercialIdentityFlags;
}): { displayName: string; secondaryName?: string } {
  const terrainType = input.actorRole === "grossiste_b" ? "GROSSISTE_B" : "DETAILLANT";
  const identity = resolveTerrainDisplayIdentity({
    actorId: input.partnerId,
    actorType: terrainType,
    phoneNumber: input.phone,
    contactName: input.localContactName,
    registeredBusinessName: input.registeredBusinessName,
    registeredPersonalName: input.registeredPersonalName,
    activityLabel: input.activityLabel,
    city: input.city,
    matchKind: input.localContactName ? "mutual" : undefined,
  });
  return { displayName: identity.displayName, secondaryName: identity.secondaryName };
}
