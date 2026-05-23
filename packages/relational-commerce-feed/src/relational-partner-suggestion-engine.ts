import { mockCommercialDiscoveryView } from "commercial-network-discovery";

import { computeCommercialProximityScore, rankByCommercialProximity } from "./commercial-proximity-score.js";
import { isCommerciallyCompatible } from "./commercial-interest-proximity-engine.js";
import type { PartnerSuggestionCandidate, RelationalFeedActorRole } from "./relational-feed.types.js";

export function resolveSuggestionDisplayName(s: {
  localContactName?: string;
  displayName: string;
  registeredBusinessName?: string;
}): string {
  if (s.localContactName?.trim()) return s.localContactName.trim();
  return s.registeredBusinessName?.trim() || s.displayName;
}

export function RelationalPartnerSuggestionEngine(input: {
  role: RelationalFeedActorRole;
  viewerActivity: string;
  viewerCity?: string;
  contacts?: Array<{ phone: string; localName?: string; mutual?: boolean }>;
}): PartnerSuggestionCandidate[] {
  const actorRole = input.role === "grossiste_b" ? "grossiste_b" : "detaillant";
  const view = mockCommercialDiscoveryView(actorRole);
  const contactByPhone = new Map(
    (input.contacts ?? []).map((c) => [c.phone.replace(/\s/g, ""), c]),
  );

  const candidates: PartnerSuggestionCandidate[] = view.suggestions
    .filter((s) => isCommerciallyCompatible(input.viewerActivity, s.activityLabel))
    .map((s) => {
      const contact = contactByPhone.get(s.phone.replace(/\s/g, ""));
      const mutual = contact?.mutual ?? s.matchKind === "mutual";
      const c: PartnerSuggestionCandidate = {
        id: s.id,
        displayName: s.displayName,
        localContactName: contact?.localName ?? s.localContactName,
        registeredBusinessName: s.registeredBusinessName,
        partnerRoleLabel: s.partnerRoleLabel ?? s.activityLabel,
        city: s.city,
        activityCategory: s.activityLabel,
        phone: s.phone,
        mutualContact: mutual,
        catalogPreviewUrls: s.catalogPreviewImageUrls,
        businessAudioUrl: s.businessAudioUrl,
        proximityScore: 0,
      };
      c.proximityScore = computeCommercialProximityScore({
        viewerActivity: input.viewerActivity,
        viewerCity: input.viewerCity,
        candidate: c,
      });
      return c;
    });

  return rankByCommercialProximity(candidates);
}
