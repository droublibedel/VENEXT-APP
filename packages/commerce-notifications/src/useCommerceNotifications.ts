import { useCallback, useEffect, useRef, useState } from "react";

import { buildCenterViewModel } from "./commerce-notifications-center";
import { DEFAULT_COMMERCE_NOTIFICATION_PREFERENCES } from "./commerce-notifications-governance";
import {
  fallbackNotificationsEnvelope,
  fetchNotificationsFromBff,
  fetchPreferencesFromBff,
  patchAllNotificationsRead,
  patchNotificationRead,
  patchPreferencesToBff,
  readLocalPreferences,
  shouldUseBff,
  writeLocalNotificationCache,
  writeLocalPreferences,
} from "./commerce-notifications-storage";
import type {
  CommerceActorRole,
  CommerceNotification,
  CommerceNotificationPreferences,
  CommerceNotificationsFlags,
  CommerceNotificationsLiveState,
} from "./commerce-notifications.types";

export type UseCommerceNotificationsOptions = {
  actorRole: CommerceActorRole;
  organizationId: string;
  flags?: CommerceNotificationsFlags;
  flagsHydrated?: boolean;
  enabled?: boolean;
};

export function useCommerceNotifications(
  options: UseCommerceNotificationsOptions,
): CommerceNotificationsLiveState {
  const {
    actorRole,
    organizationId,
    flags = {},
    flagsHydrated = true,
    enabled = true,
  } = options;

  const [notifications, setNotifications] = useState<CommerceNotification[]>([]);
  const [preferences, setPreferences] = useState<CommerceNotificationPreferences>(() =>
    readLocalPreferences(organizationId),
  );
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState<string | null>(null);
  const [dataSource, setDataSource] = useState<"live" | "fallback" | "mixed">("fallback");
  const [fallbackUsed, setFallbackUsed] = useState(true);
  const abortRef = useRef<AbortController | null>(null);

  const load = useCallback(() => {
    if (!enabled || flags.commerce_notifications_enabled === false) {
      setLoading(false);
      return;
    }
    abortRef.current?.abort();
    const ac = new AbortController();
    abortRef.current = ac;
    setLoading(true);
    setError(null);

    const applyFallback = () => {
      const env = fallbackNotificationsEnvelope(actorRole, organizationId);
      setNotifications(env.payload);
      setDataSource(env.dataSource);
      setFallbackUsed(true);
      writeLocalNotificationCache(organizationId, env.payload);
      setLoading(false);
    };

    if (!shouldUseBff(flags, flagsHydrated)) {
      setPreferences(readLocalPreferences(organizationId));
      applyFallback();
      return;
    }

    void Promise.all([
      fetchNotificationsFromBff(organizationId, ac.signal),
      fetchPreferencesFromBff(organizationId),
    ]).then(([notifEnv, prefEnv]) => {
      if (ac.signal.aborted) return;
      if (prefEnv?.payload) {
        const merged = { ...DEFAULT_COMMERCE_NOTIFICATION_PREFERENCES, ...prefEnv.payload };
        setPreferences(merged);
        writeLocalPreferences(organizationId, merged);
      } else {
        setPreferences(readLocalPreferences(organizationId));
      }
      if (notifEnv) {
        setNotifications(notifEnv.payload);
        setDataSource(notifEnv.dataSource);
        setFallbackUsed(notifEnv.fallbackUsed);
        writeLocalNotificationCache(organizationId, notifEnv.payload);
        setLoading(false);
        return;
      }
      if (flags.venext_live_data_fallback_enabled === false) {
        setNotifications([]);
        setError("unavailable");
        setLoading(false);
        return;
      }
      applyFallback();
    });
  }, [actorRole, enabled, flags, flagsHydrated, organizationId]);

  useEffect(() => {
    load();
    return () => abortRef.current?.abort();
  }, [load]);

  const markRead = useCallback(
    async (id: string) => {
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
      if (shouldUseBff(flags, flagsHydrated)) await patchNotificationRead(id, organizationId);
    },
    [flags, flagsHydrated, organizationId],
  );

  const markAllRead = useCallback(async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    if (shouldUseBff(flags, flagsHydrated)) await patchAllNotificationsRead(organizationId);
  }, [flags, flagsHydrated, organizationId]);

  const updatePreferences = useCallback(
    async (patch: Partial<CommerceNotificationPreferences>) => {
      setPreferences((prev) => {
        const next = { ...prev, ...patch };
        writeLocalPreferences(organizationId, next);
        return next;
      });
      if (shouldUseBff(flags, flagsHydrated)) {
        await patchPreferencesToBff(organizationId, patch);
      }
    },
    [flags, flagsHydrated, organizationId],
  );

  const vm = buildCenterViewModel(notifications, actorRole, preferences);

  return {
    notifications: vm.notifications,
    unreadCount: vm.unreadCount,
    preferences,
    loading,
    error,
    dataSource,
    fallbackUsed,
    refresh: load,
    markRead,
    markAllRead,
    updatePreferences,
  };
}
