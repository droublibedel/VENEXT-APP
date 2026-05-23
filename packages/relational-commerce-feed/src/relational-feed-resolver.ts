import { RelationalFeedPipeline } from "./relational-feed-pipeline.js";
import type { RelationalFeedPage, RelationalFeedResolverInput } from "./relational-feed.types.js";
import { trackRelationalFeedEvent } from "./relational-feed-observability.js";

const PAGE_SIZE = 20;

export function RelationalFeedResolver(
  input: RelationalFeedResolverInput,
  page = 0,
): RelationalFeedPage {
  const { entries, layersUsed, feedEmptyPrevented } = RelationalFeedPipeline(input);
  const start = page * PAGE_SIZE;
  const slice = entries.slice(start, start + PAGE_SIZE);

  if (feedEmptyPrevented) {
    trackRelationalFeedEvent("feed_empty_prevented", { actorId: input.actorId });
  }
  if (layersUsed.includes("SPONSORED_RELATIONAL_CONTENT")) {
    trackRelationalFeedEvent("sponsored_relational_inserted", { count: entries.filter((e) => e.sponsored).length });
  }
  if (entries.some((e) => e.type === "BOOTSTRAP")) {
    trackRelationalFeedEvent("bootstrap_content_served", { actorId: input.actorId });
  }
  if (!entries.some((e) => e.type === "PARTNER") && input.partnerIds?.length) {
    trackRelationalFeedEvent("partner_feed_exhausted", { partners: input.partnerIds.length });
  }
  if (layersUsed.includes("DISCOVERY_SUGGESTIONS")) {
    trackRelationalFeedEvent("discovery_feed_injected", { count: entries.filter((e) => e.type === "DISCOVERY").length });
  }

  return {
    entries: slice.length ? slice : entries.slice(0, PAGE_SIZE),
    hasMore: start + PAGE_SIZE < entries.length,
    feedEmptyPrevented: entries.length > 0,
    layersUsed,
  };
}
