import {
  FeedContentBalancer,
  hasExcessiveConsecutiveSponsored,
  MAX_CONSECUTIVE_SPONSORED,
} from "../feed-content-balancer.js";
import type { FeedEntry } from "../relational-feed.types.js";
import { isCommerciallyCompatible, proximityLevel } from "../commercial-interest-proximity-engine.js";
import { officialBootstrapCommercialContent } from "../official-bootstrap-commercial-content.js";
import { RelationalFeedPipeline } from "../relational-feed-pipeline.js";
import { buildSponsoredRelationalEntries } from "../sponsored-relational-insertion.js";
import { resolveSuggestionDisplayName } from "../relational-partner-suggestion-engine.js";

export type RelationalFeedAuditFinding = { code: string; ok: boolean };

export function auditRelationalFeedNeverEmpty(): RelationalFeedAuditFinding[] {
  const r = RelationalFeedPipeline({
    actorId: "new-user",
    role: "detaillant",
    city: "Abidjan",
    categories: ["chaussures"],
    partnerIds: [],
  });
  return [{ code: "FEED_HAS_ENTRIES", ok: r.entries.length > 0 }];
}

export function auditSponsoredRelationalBalance(): RelationalFeedAuditFinding[] {
  const sponsored = buildSponsoredRelationalEntries("chaussures");
  const fake = [
    ...Array.from({ length: 6 }, (_, i) => ({
      id: `p${i}`,
      type: "PARTNER" as const,
      layer: "PARTNER_CONTENT" as const,
      partnerId: `p${i}`,
      displayName: "P",
      activityCategory: "chaussures",
      proximityScore: 1,
      publishedAt: "",
      inviteable: false,
      sponsored: false,
    })),
    ...sponsored,
  ];
  const balanced = FeedContentBalancer(fake as FeedEntry[]);
  return [
    { code: "SPONSORED_COMPATIBLE_ONLY", ok: sponsored.every((s) => !s.activityCategory.includes("matelas")) },
    { code: "NO_4_CONSECUTIVE_SPONSORED", ok: !hasExcessiveConsecutiveSponsored(balanced) },
    { code: "MAX_SPONSORED_RULE", ok: MAX_CONSECUTIVE_SPONSORED === 3 },
  ];
}

export function auditCommercialProximitySuggestions(): RelationalFeedAuditFinding[] {
  return [
    { code: "SHOES_BAGS_COMPATIBLE", ok: isCommerciallyCompatible("chaussures", "sacs") },
    { code: "SHOES_MATTRESS_BLOCKED", ok: !isCommerciallyCompatible("chaussures", "matelas") },
    { code: "LEVEL1_SAME", ok: proximityLevel("chaussures", "chaussures") === 1 },
  ];
}

export function auditBootstrapCommercialContent(): RelationalFeedAuditFinding[] {
  const b = officialBootstrapCommercialContent();
  return [
    { code: "BOOTSTRAP_NOT_EMPTY", ok: b.length >= 5 },
    { code: "BOOTSTRAP_REALISTIC", ok: b.some((e) => e.activityCategory.includes("chaussures")) },
  ];
}

export function auditPartnerPriorityDominance(): RelationalFeedAuditFinding[] {
  const r = RelationalFeedPipeline({
    actorId: "u1",
    role: "detaillant",
    categories: ["chaussures"],
    partnerIds: ["p1", "p2", "p3"],
  });
  const first = r.entries[0];
  return [
    { code: "PARTNER_FIRST_WHEN_EXISTS", ok: first?.type === "PARTNER" || first?.type === "EXTENDED" },
    { code: "CONTACT_NAME_PRIORITY", ok: resolveSuggestionDisplayName({ localContactName: "Frère Moussa", displayName: "Boutique" }) === "Frère Moussa" },
  ];
}
