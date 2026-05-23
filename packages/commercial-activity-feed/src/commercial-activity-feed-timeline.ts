import type {
  CommercialActivityGroup,
  CommercialActivityItem,
  CommercialActivitySummary,
  CommercialActivityTimelineBucket,
  CommercialActivityTimelineSection,
} from "./commercial-activity-feed.types";
import { buildActivityGroups } from "./commercial-activity-feed-grouping";

function startOfDay(d: Date): number {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

export function resolveTimelineBucket(iso: string, now = new Date()): CommercialActivityTimelineBucket {
  const t = new Date(iso).getTime();
  const todayStart = startOfDay(now);
  const yesterdayStart = todayStart - 86_400_000;
  const weekStart = todayStart - 6 * 86_400_000;

  if (t >= todayStart) return "today";
  if (t >= yesterdayStart) return "yesterday";
  if (t >= weekStart) return "this_week";
  return "older";
}

const BUCKET_LABEL: Record<CommercialActivityTimelineBucket, string> = {
  today: "activity.timeline.today",
  yesterday: "activity.timeline.yesterday",
  this_week: "activity.timeline.this_week",
  older: "activity.timeline.older",
};

const BUCKET_ORDER: CommercialActivityTimelineBucket[] = [
  "today",
  "yesterday",
  "this_week",
  "older",
];

export function buildActivityTimeline(
  items: CommercialActivityItem[],
  groupingEnabled = true,
): CommercialActivityTimelineSection[] {
  const sorted = [...items].sort((a, b) => b.occurredAt.localeCompare(a.occurredAt));
  const byBucket = new Map<CommercialActivityTimelineBucket, CommercialActivityItem[]>();

  for (const item of sorted) {
    const bucket = resolveTimelineBucket(item.occurredAt);
    const list = byBucket.get(bucket) ?? [];
    list.push(item);
    byBucket.set(bucket, list);
  }

  return BUCKET_ORDER.filter((b) => (byBucket.get(b)?.length ?? 0) > 0).map((bucket) => {
    const bucketItems = byBucket.get(bucket) ?? [];
    return {
      bucket,
      labelKey: BUCKET_LABEL[bucket],
      items: bucketItems,
      groups: buildActivityGroups(bucketItems, groupingEnabled),
    };
  });
}

export function buildActivitySummary(
  items: CommercialActivityItem[],
  organizationId: string,
): CommercialActivitySummary {
  const todayItems = items.filter((i) => resolveTimelineBucket(i.occurredAt) === "today");
  const ordersToday = todayItems.filter((i) => i.category === "orders").length;
  const deliveriesToday = todayItems.filter((i) => i.category === "deliveries").length;
  const partners = new Set(
    todayItems.map((i) => i.partnerId ?? i.relationshipId).filter(Boolean),
  );

  let headlineKey = "activity.summary.quiet";
  if (ordersToday >= 3) headlineKey = "activity.summary.orders_busy";
  else if (deliveriesToday >= 2) headlineKey = "activity.summary.deliveries_active";

  return {
    organizationId,
    totalToday: todayItems.length,
    ordersToday,
    deliveriesToday,
    partnersActive: partners.size,
    headlineKey,
  };
}
