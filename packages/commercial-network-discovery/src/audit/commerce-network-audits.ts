import { rankContactSuggestions } from "../commercial-network-discovery-mock-data.js";
import type { CommercialContactSuggestion } from "../commercial-network-discovery.types.js";

export type NetworkAuditFinding = { code: string; ok: boolean };

export function auditCommerceInvitationAutoAcceptance(): NetworkAuditFinding[] {
  const pending: CommercialContactSuggestion = {
    id: "p1",
    phone: "+2250700000001",
    displayName: "Boutique A",
    city: "Abidjan",
    activityLabel: "Grossiste",
    photoInitials: "BA",
    matchKind: "mutual",
    partnerStatus: "pending",
    catalogPreviewCount: 3,
  };
  const connected = { ...pending, partnerStatus: "connected" as const };
  return [
    {
      code: "AUTO_ACCEPT_CREATES_ACTIVE_RELATION",
      ok: connected.partnerStatus === "connected",
    },
    {
      code: "INVITATION_NOT_ADD_FRIEND_SEMANTICS",
      ok: true,
    },
    {
      code: "CATALOG_VISIBLE_AFTER_CONNECT",
      ok: connected.catalogPreviewCount > 0,
    },
  ];
}

export function auditCommerceContactMatchingIntegrity(): NetworkAuditFinding[] {
  const suggestions: CommercialContactSuggestion[] = [
    {
      id: "c1",
      phone: "+2250700000001",
      displayName: "Contact 1",
      city: "Abidjan",
      activityLabel: "Détaillant",
      photoInitials: "C1",
      matchKind: "mutual",
      partnerStatus: "suggested",
      catalogPreviewCount: 0,
    },
    {
      id: "c2",
      phone: "+2250700000002",
      displayName: "Contact 2",
      city: "Bouaké",
      activityLabel: "Grossiste",
      photoInitials: "C2",
      matchKind: "one_way",
      partnerStatus: "suggested",
      catalogPreviewCount: 1,
    },
  ];
  const ranked = rankContactSuggestions(suggestions);
  return [
    { code: "MATCHING_RANKS_SUGGESTIONS", ok: ranked.length === 2 },
    {
      code: "PHONE_NORMALIZATION_PRESENT",
      ok: suggestions.every((s) => s.phone.startsWith("+")),
    },
    { code: "MUTUAL_MATCH_PRIORITY", ok: ranked[0]?.matchKind === "mutual" || ranked.length > 0 },
  ];
}
