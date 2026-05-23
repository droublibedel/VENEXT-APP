import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { sliceVisibleWindow } from "commerce-performance-foundation";

import { filterActivitiesForViewer } from "./commercial-activity-feed-governance";
import { buildActivityGroups } from "./commercial-activity-feed-grouping";
import {
  buildActivitySummary,
  buildActivityTimeline,
} from "./commercial-activity-feed-timeline";
import {
  fallbackActivityEnvelope,
  fetchActivityFeedFromBff,
  fetchActivitySummaryFromBff,
  patchActivityRead,
  shouldUseActivityBff,
  writeLocalActivityCache,
} from "./commercial-activity-feed-storage";
import type {
  CommercialActivityActorRole,
  CommercialActivityFeedFlags,
  CommercialActivityFeedState,
  CommercialActivityFilter,
  CommercialActivityItem,
} from "./commercial-activity-feed.types";

export type UseCommercialActivityFeedOptions = {
  actorRole: CommercialActivityActorRole;
  organizationId: string;
  flags?: CommercialActivityFeedFlags;
  flagsHydrated?: boolean;
  enabled?: boolean;
};

export function useCommercialActivityFeed(
  options: UseCommercialActivityFeedOptions,
): CommercialActivityFeedState {
  const {
    actorRole,
    organizationId,
    flags = {},
    flagsHydrated = true,
    enabled = true,
  } = options;

  const [rawItems, setRawItems] = useState<CommercialActivityItem[]>([]);
  const [summary, setSummary] = useState<ReturnType<typeof buildActivitySummary> | null>(null);
  const [filter, setFilter] = useState<CommercialActivityFilter>("all");
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState<string | null>(null);
  const [dataSource, setDataSource] = useState<"live" | "fallback" | "mixed">("fallback");
  const [fallbackUsed, setFallbackUsed] = useState(true);
  const abortRef = useRef<AbortController | null>(null);

  const groupingEnabled = flags.commercial_activity_grouping_enabled !== false;
  const timelineEnabled = flags.commercial_activity_timeline_enabled !== false;

  const visibleItems = useMemo(() => {
    const filtered = filterActivitiesForViewer(rawItems, actorRole, organizationId, filter, flags);
    return sliceVisibleWindow(filtered, 50);
  }, [rawItems, actorRole, organizationId, filter, flags]);

  const groups = useMemo(
    () => buildActivityGroups(visibleItems, groupingEnabled),
    [visibleItems, groupingEnabled],
  );

  const timeline = useMemo(
    () => (timelineEnabled ? buildActivityTimeline(visibleItems, groupingEnabled) : []),
    [visibleItems, timelineEnabled, groupingEnabled],
  );

  const computedSummary = useMemo(
    () => summary ?? buildActivitySummary(visibleItems, organizationId),
    [summary, visibleItems, organizationId],
  );

  const load = useCallback(() => {
    if (!enabled || flags.commercial_activity_feed_enabled === false) {
      setLoading(false);
      return;
    }
    abortRef.current?.abort();
    const ac = new AbortController();
    abortRef.current = ac;
    setLoading(true);
    setError(null);

    const applyFallback = () => {
      const env = fallbackActivityEnvelope(actorRole, organizationId);
      setRawItems(env.payload);
      setSummary(buildActivitySummary(env.payload, organizationId));
      setDataSource(env.dataSource);
      setFallbackUsed(true);
      writeLocalActivityCache(organizationId, env.payload);
      setLoading(false);
    };

    if (!shouldUseActivityBff(flags, flagsHydrated)) {
      applyFallback();
      return;
    }

    void Promise.all([
      fetchActivityFeedFromBff(organizationId, ac.signal),
      fetchActivitySummaryFromBff(organizationId),
    ]).then(([feedEnv, summaryEnv]) => {
      if (ac.signal.aborted) return;
      if (feedEnv) {
        setRawItems(feedEnv.payload);
        writeLocalActivityCache(organizationId, feedEnv.payload);
        setDataSource(feedEnv.dataSource);
        setFallbackUsed(feedEnv.fallbackUsed);
      } else if (flags.venext_live_data_fallback_enabled === false) {
        setRawItems([]);
        setError("unavailable");
        setLoading(false);
        return;
      } else {
        applyFallback();
        return;
      }
      if (summaryEnv?.payload) setSummary(summaryEnv.payload);
      else setSummary(buildActivitySummary(feedEnv?.payload ?? [], organizationId));
      setLoading(false);
    });
  }, [actorRole, enabled, flags, flagsHydrated, organizationId]);

  useEffect(() => {
    load();
    return () => abortRef.current?.abort();
  }, [load]);

  const markRead = useCallback(
    async (id: string) => {
      setRawItems((prev) => prev.map((i) => (i.id === id ? { ...i, read: true } : i)));
      if (shouldUseActivityBff(flags, flagsHydrated)) await patchActivityRead(id, organizationId);
    },
    [flags, flagsHydrated, organizationId],
  );

  return {
    items: visibleItems,
    timeline,
    groups,
    summary: computedSummary,
    filter,
    loading,
    error,
    dataSource,
    fallbackUsed,
    refresh: load,
    setFilter,
    markRead,
  };
}
