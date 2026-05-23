/** Entrée sans React — pour BFF Node. */
export { RelationalFeedResolver } from "./relational-feed-resolver.js";
export { RelationalFeedPipeline } from "./relational-feed-pipeline.js";
export {
  configureRelationalFeedObservabilityReporter,
  trackRelationalFeedEvent,
  type RelationalFeedObservabilityEvent,
} from "./relational-feed-observability.js";
export type { RelationalFeedPage, RelationalFeedResolverInput, FeedEntry } from "./relational-feed.types.js";
