import type {
  CommerceActorRole,
  CommerceNotification,
  CommerceNotificationPreferences,
  CommerceNotificationsEnvelope,
  CommerceNotificationsFlags,
} from "./commerce-notifications.types";
import { buildDemoCommerceNotifications } from "./commerce-notifications-events";
import { DEFAULT_COMMERCE_NOTIFICATION_PREFERENCES } from "./commerce-notifications-governance";

const PREF_KEY = (org: string) => `venext:commerce-notification-prefs:${org}`;
const CACHE_KEY = (org: string) => `venext:commerce-notification-cache:${org}`;

export function readLocalPreferences(organizationId: string): CommerceNotificationPreferences {
  if (typeof localStorage === "undefined") return { ...DEFAULT_COMMERCE_NOTIFICATION_PREFERENCES };
  try {
    const raw = localStorage.getItem(PREF_KEY(organizationId));
    if (!raw) return { ...DEFAULT_COMMERCE_NOTIFICATION_PREFERENCES };
    return { ...DEFAULT_COMMERCE_NOTIFICATION_PREFERENCES, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULT_COMMERCE_NOTIFICATION_PREFERENCES };
  }
}

export function writeLocalPreferences(
  organizationId: string,
  prefs: CommerceNotificationPreferences,
): void {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem(PREF_KEY(organizationId), JSON.stringify(prefs));
}

export function readLocalNotificationCache(organizationId: string): CommerceNotification[] | null {
  if (typeof localStorage === "undefined") return null;
  try {
    const raw = localStorage.getItem(CACHE_KEY(organizationId));
    return raw ? (JSON.parse(raw) as CommerceNotification[]) : null;
  } catch {
    return null;
  }
}

const MAX_NOTIFICATION_CACHE = 80;

export function writeLocalNotificationCache(
  organizationId: string,
  items: CommerceNotification[],
): void {
  if (typeof localStorage === "undefined") return;
  const trimmed = items.length > MAX_NOTIFICATION_CACHE ? items.slice(0, MAX_NOTIFICATION_CACHE) : items;
  localStorage.setItem(CACHE_KEY(organizationId), JSON.stringify(trimmed));
}

/** Trim notification cache (Instruction 20.85). */
export function cleanupNotificationCache(
  organizationId: string,
  maxItems = MAX_NOTIFICATION_CACHE,
): number {
  if (typeof localStorage === "undefined") return 0;
  try {
    const raw = localStorage.getItem(CACHE_KEY(organizationId));
    if (!raw) return 0;
    const parsed = JSON.parse(raw) as CommerceNotification[];
    if (!Array.isArray(parsed) || parsed.length <= maxItems) return 0;
    writeLocalNotificationCache(organizationId, parsed.slice(0, maxItems));
    return parsed.length - maxItems;
  } catch {
    localStorage.removeItem(CACHE_KEY(organizationId));
    return 0;
  }
}

export function fallbackNotificationsEnvelope(
  actorRole: CommerceActorRole,
  organizationId: string,
): CommerceNotificationsEnvelope<CommerceNotification[]> {
  const cached = readLocalNotificationCache(organizationId);
  const payload = cached ?? buildDemoCommerceNotifications(actorRole, organizationId);
  return {
    dataSource: "fallback",
    fallbackUsed: true,
    devBadge: true,
    payload,
  };
}

export async function fetchNotificationsFromBff(
  organizationId: string,
  signal?: AbortSignal,
): Promise<CommerceNotificationsEnvelope<CommerceNotification[]> | null> {
  const url = `/api/notifications?organizationId=${encodeURIComponent(organizationId)}`;
  try {
    const res = await fetch(url, { credentials: "include", cache: "no-store", signal });
    if (!res.ok) return null;
    return (await res.json()) as CommerceNotificationsEnvelope<CommerceNotification[]>;
  } catch {
    return null;
  }
}

export async function patchNotificationRead(id: string, organizationId: string): Promise<boolean> {
  try {
    const res = await fetch(
      `/api/notifications/${encodeURIComponent(id)}/read?organizationId=${encodeURIComponent(organizationId)}`,
      { method: "PATCH", credentials: "include" },
    );
    return res.ok;
  } catch {
    return false;
  }
}

export async function patchAllNotificationsRead(organizationId: string): Promise<boolean> {
  try {
    const res = await fetch(
      `/api/notifications/read-all?organizationId=${encodeURIComponent(organizationId)}`,
      { method: "PATCH", credentials: "include" },
    );
    return res.ok;
  } catch {
    return false;
  }
}

export async function fetchPreferencesFromBff(
  organizationId: string,
): Promise<CommerceNotificationsEnvelope<CommerceNotificationPreferences> | null> {
  try {
    const res = await fetch(
      `/api/notifications/preferences?organizationId=${encodeURIComponent(organizationId)}`,
      { credentials: "include", cache: "no-store" },
    );
    if (!res.ok) return null;
    return (await res.json()) as CommerceNotificationsEnvelope<CommerceNotificationPreferences>;
  } catch {
    return null;
  }
}

export async function patchPreferencesToBff(
  organizationId: string,
  prefs: Partial<CommerceNotificationPreferences>,
): Promise<boolean> {
  try {
    const res = await fetch(
      `/api/notifications/preferences?organizationId=${encodeURIComponent(organizationId)}`,
      {
        method: "PATCH",
        credentials: "include",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(prefs),
      },
    );
    return res.ok;
  } catch {
    return false;
  }
}

export function shouldUseBff(flags: CommerceNotificationsFlags, hydrated: boolean): boolean {
  return hydrated && flags.commerce_notifications_enabled !== false && flags.venext_bff_routes_enabled !== false;
}

/** Pas de polling — refresh manuel uniquement (Instruction 20.80). */
export const COMMERCE_NOTIFICATIONS_POLLING_MS = 0;
