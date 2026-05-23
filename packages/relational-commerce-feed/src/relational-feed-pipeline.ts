import { FeedContentBalancer } from "./feed-content-balancer.js";
import { isCommerciallyCompatible } from "./commercial-interest-proximity-engine.js";
import { officialBootstrapCommercialContent } from "./official-bootstrap-commercial-content.js";
import { RelationalPartnerSuggestionEngine, resolveSuggestionDisplayName } from "./relational-partner-suggestion-engine.js";
import { buildSponsoredRelationalEntries } from "./sponsored-relational-insertion.js";
import type { FeedEntry, FeedPipelineLayer, RelationalFeedResolverInput } from "./relational-feed.types.js";

function partnerContentEntries(input: RelationalFeedResolverInput): FeedEntry[] {
  const partners = input.partnerIds ?? [];
  if (!partners.length || input.partnersPublished === false) return [];

  return partners.map((pid, i) => ({
    id: `partner-post-${pid}`,
    type: "PARTNER" as const,
    layer: "PARTNER_CONTENT" as const,
    partnerId: pid,
    displayName: `Partenaire ${i + 1}`,
    partnerRoleLabel: "Partenaire",
    city: input.city,
    activityCategory: input.categories?.[0] ?? "commerce",
    imageUrl: `https://mock.venext.ci/partner/${pid}.jpg`,
    catalogPreviewUrls: [`https://mock.venext.ci/partner/${pid}-1.jpg`],
    proximityScore: 90 - i,
    publishedAt: new Date(Date.now() - i * 600_000).toISOString(),
    inviteable: false,
    sponsored: false,
  }));
}

function extendedRelationalEntries(input: RelationalFeedResolverInput): FeedEntry[] {
  const activity = input.categories?.[0] ?? "commerce";
  const extended = [
    { id: "ext-1", name: "Grossiste complémentaire", cat: "accessoires" },
    { id: "ext-2", name: "Boutique proche", cat: "sacs" },
  ];
  return extended
    .filter((e) => isCommerciallyCompatible(activity, e.cat))
    .map((e, i) => ({
      id: `extended-${e.id}`,
      type: "EXTENDED" as const,
      layer: "EXTENDED_RELATIONAL_CONTENT" as const,
      partnerId: e.id,
      displayName: e.name,
      partnerRoleLabel: "Grossiste",
      city: input.city,
      activityCategory: e.cat,
      imageUrl: `https://mock.venext.ci/ext/${e.id}.jpg`,
      proximityScore: 55 - i,
      publishedAt: new Date().toISOString(),
      inviteable: true,
      sponsored: false,
    }));
}

function discoveryEntries(input: RelationalFeedResolverInput): FeedEntry[] {
  const suggestions = RelationalPartnerSuggestionEngine({
    role: input.role,
    viewerActivity: input.categories?.[0] ?? "commerce",
    viewerCity: input.city,
    contacts: input.contacts,
  });

  return suggestions.slice(0, 8).map((s) => ({
    id: `discovery-${s.id}`,
    type: "DISCOVERY" as const,
    layer: "DISCOVERY_SUGGESTIONS" as const,
    partnerId: s.id,
    displayName: resolveSuggestionDisplayName(s),
    localContactName: s.localContactName,
    partnerRoleLabel: s.partnerRoleLabel,
    city: s.city,
    activityCategory: s.activityCategory,
    catalogPreviewUrls: s.catalogPreviewUrls,
    businessAudioUrl: s.businessAudioUrl,
    proximityScore: s.proximityScore,
    publishedAt: new Date().toISOString(),
    inviteable: true,
    sponsored: false,
  }));
}

/** Pipeline strict — jamais vide. */
export function RelationalFeedPipeline(input: RelationalFeedResolverInput): {
  entries: FeedEntry[];
  layersUsed: FeedPipelineLayer[];
  feedEmptyPrevented: boolean;
} {
  const layersUsed: FeedPipelineLayer[] = [];
  const partner = partnerContentEntries(input);
  if (partner.length) layersUsed.push("PARTNER_CONTENT");

  let extended = extendedRelationalEntries(input);
  if (partner.length < 3) {
    if (extended.length) layersUsed.push("EXTENDED_RELATIONAL_CONTENT");
  } else {
    extended = [];
  }

  const partnersLinkedNoPosts =
    (input.partnerIds?.length ?? 0) > 0 && input.partnersPublished === false;
  let sponsored = buildSponsoredRelationalEntries(input.categories?.[0] ?? "commerce", input.city);
  if (partner.length + extended.length < 5 || partnersLinkedNoPosts) {
    if (sponsored.length) layersUsed.push("SPONSORED_RELATIONAL_CONTENT");
  } else if (!partnersLinkedNoPosts && partner.length + extended.length >= 5) {
    sponsored = [];
  }

  let discovery = discoveryEntries(input);
  if (discovery.length) layersUsed.push("DISCOVERY_SUGGESTIONS");

  let bootstrap = officialBootstrapCommercialContent(input.city);
  const rawCount = partner.length + extended.length + sponsored.length + discovery.length;
  const feedEmptyPrevented = rawCount === 0;
  if (feedEmptyPrevented || rawCount < 4) {
    bootstrap = officialBootstrapCommercialContent(input.city);
    if (!layersUsed.includes("DISCOVERY_SUGGESTIONS")) layersUsed.push("DISCOVERY_SUGGESTIONS");
  }

  const merged = FeedContentBalancer([
    ...partner,
    ...extended,
    ...sponsored,
    ...discovery,
    ...(rawCount < 6 ? bootstrap : []),
  ]);

  const entries = merged.length ? merged : bootstrap;
  return {
    entries,
    layersUsed,
    feedEmptyPrevented: feedEmptyPrevented || entries.length > 0,
  };
}
