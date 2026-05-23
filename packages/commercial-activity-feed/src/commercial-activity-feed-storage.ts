import type {
  CommercialActivityActorRole,
  CommercialActivityFeedEnvelope,
  CommercialActivityFeedFlags,
  CommercialActivityItem,
  CommercialActivitySummary,
} from "./commercial-activity-feed.types";
import { buildDemoCommercialActivityFeed } from "./commercial-activity-feed-events";

const CACHE_KEY = (org: string) => `venext:commercial-activity-feed:${org}`;

export function readLocalActivityCache(organizationId: string): CommercialActivityItem[] | null {
  if (typeof localStorage === "undefined") return null;
  try {
    const raw = localStorage.getItem(CACHE_KEY(organizationId));
    return raw ? (JSON.parse(raw) as CommercialActivityItem[]) : null;
  } catch {
    return null;
  }
}

const MAX_ACTIVITY_CACHE = 80;

export function writeLocalActivityCache(organizationId: string, items: CommercialActivityItem[]): void {
  if (typeof localStorage === "undefined") return;
  const trimmed = items.length > MAX_ACTIVITY_CACHE ? items.slice(0, MAX_ACTIVITY_CACHE) : items;
  localStorage.setItem(CACHE_KEY(organizationId), JSON.stringify(trimmed));
}

export function fallbackActivityEnvelope(
  actorRole: CommercialActivityActorRole,
  organizationId: string,
): CommercialActivityFeedEnvelope<CommercialActivityItem[]> {
  const cached = readLocalActivityCache(organizationId);
  return {
    dataSource: "fallback",
    fallbackUsed: true,
    devBadge: true,
    payload: cached ?? buildDemoCommercialActivityFeed(actorRole, organizationId),
  };
}

export async function fetchActivityFeedFromBff(
  organizationId: string,
  signal?: AbortSignal,
): Promise<CommercialActivityFeedEnvelope<CommercialActivityItem[]> | null> {
  try {
    const res = await fetch(
      `/api/activity-feed?organizationId=${encodeURIComponent(organizationId)}`,
      { credentials: "include", cache: "no-store", signal },
    );
    if (!res.ok) return null;
    return (await res.json()) as CommercialActivityFeedEnvelope<CommercialActivityItem[]>;
  } catch {
    return null;
  }
}

export async function fetchActivitySummaryFromBff(
  organizationId: string,
): Promise<CommercialActivityFeedEnvelope<CommercialActivitySummary> | null> {
  try {
    const res = await fetch(
      `/api/activity-feed/summary?organizationId=${encodeURIComponent(organizationId)}`,
      { credentials: "include", cache: "no-store" },
    );
    if (!res.ok) return null;
    return (await res.json()) as CommercialActivityFeedEnvelope<CommercialActivitySummary>;
  } catch {
    return null;
  }
}

export async function patchActivityRead(id: string, organizationId: string): Promise<boolean> {
  try {
    const res = await fetch(
      `/api/activity-feed/${encodeURIComponent(id)}/read?organizationId=${encodeURIComponent(organizationId)}`,
      { method: "PATCH", credentials: "include" },
    );
    return res.ok;
  } catch {
    return false;
  }
}

export function shouldUseActivityBff(flags: CommercialActivityFeedFlags, hydrated: boolean): boolean {
  return (
    hydrated &&
    flags.commercial_activity_feed_enabled !== false &&
    flags.venext_bff_routes_enabled !== false
  );
}
