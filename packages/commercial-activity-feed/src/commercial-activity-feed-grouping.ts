import type {
  CommercialActivityCategory,
  CommercialActivityGroup,
  CommercialActivityItem,
} from "./commercial-activity-feed.types";

const GROUP_LABEL_KEYS: Partial<Record<CommercialActivityCategory, string>> = {
  orders: "activity.groups.orders",
  deliveries: "activity.groups.deliveries",
  settlements: "activity.groups.settlements",
  catalogs: "activity.groups.catalogs",
  partners: "activity.groups.partners",
  messages: "activity.groups.messages",
  mails: "activity.groups.mails",
  wallet: "activity.groups.wallet",
  network: "activity.groups.network",
};

export function buildActivityGroups(
  items: CommercialActivityItem[],
  groupingEnabled = true,
): CommercialActivityGroup[] {
  if (!groupingEnabled || items.length === 0) return [];

  const byCategory = new Map<CommercialActivityCategory, CommercialActivityItem[]>();
  for (const item of items) {
    const list = byCategory.get(item.category) ?? [];
    list.push(item);
    byCategory.set(item.category, list);
  }

  const groups: CommercialActivityGroup[] = [];
  for (const [category, catItems] of byCategory) {
    const sorted = [...catItems].sort((a, b) => b.occurredAt.localeCompare(a.occurredAt));
    groups.push({
      id: `grp-${category}`,
      category,
      labelKey: GROUP_LABEL_KEYS[category] ?? "activity.groups.generic",
      count: sorted.length,
      items: sorted,
      latestAt: sorted[0]?.occurredAt ?? new Date().toISOString(),
    });
  }

  return groups.sort((a, b) => b.latestAt.localeCompare(a.latestAt));
}
