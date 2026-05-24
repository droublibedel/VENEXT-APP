import { getActivityTranslation } from "./commercial-activity-feed-i18n";
import { buildActivitySummaryText } from "./commercial-activity-feed-intelligence";
import { CommercialActivityEmptyState } from "./CommercialActivityEmptyState";
import { CommercialActivityFilters } from "./CommercialActivityFilters";
import { CommercialActivityTimeline } from "./CommercialActivityTimeline";
import type { CommercialActivityFeedState } from "./commercial-activity-feed.types";
import type { CommercialActivityItem } from "./commercial-activity-feed.types";

type Props = {
  feed: CommercialActivityFeedState;
  locale?: string;
  onOpen?: (item: CommercialActivityItem) => void;
};

export function CommercialActivityFeed({ feed, locale = "fr-CI", onOpen }: Props) {
  const { items, timeline, summary, filter, loading, fallbackUsed, refresh, setFilter } = feed;

  return (
    <section className="caf-feed" data-testid="caf-feed">
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h2 style={{ margin: 0, fontSize: 17, color: "#17201c" }}>
          {getActivityTranslation("activity.title", locale)}
          {fallbackUsed ? <span className="caf-dev-badge">DEV</span> : null}
        </h2>
        <button type="button" onClick={refresh} disabled={loading} style={{ fontSize: 12 }}>
          {loading ? "…" : "↻"}
        </button>
      </header>
      {summary ? (
        <p style={{ margin: "4px 0 0", fontSize: 13, color: "#9fb0a8" }}>
          {buildActivitySummaryText(summary.headlineKey, locale, {
            orders: summary.ordersToday,
            deliveries: summary.deliveriesToday,
          })}
        </p>
      ) : null}
      <CommercialActivityFilters value={filter} onChange={setFilter} locale={locale} />
      {items.length === 0 && !loading ? (
        <CommercialActivityEmptyState locale={locale} />
      ) : (
        <CommercialActivityTimeline sections={timeline} locale={locale} onOpen={onOpen} />
      )}
    </section>
  );
}
