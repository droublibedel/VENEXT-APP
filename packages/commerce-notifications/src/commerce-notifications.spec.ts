import { describe, expect, it } from "vitest";

import {
  buildCenterViewModel,
  countUnread,
  markAllNotificationsReadLocal,
  markNotificationReadLocal,
  sortNotifications,
} from "./commerce-notifications-center";
import {
  COMMERCE_NOTIFICATION_EVENT_TYPES,
  assertNotSocialEvent,
  buildDemoCommerceNotifications,
  categoryForEventType,
  createCommerceNotification,
} from "./commerce-notifications-events";
import {
  DEFAULT_COMMERCE_NOTIFICATION_PREFERENCES,
  allowedEventTypesForActor,
  filterNotificationsForActor,
  isEventAllowedForActor,
  isNotificationEnabledByPreferences,
} from "./commerce-notifications-governance";
import {
  buildNotificationAction,
  buildNotificationHint,
  buildNotificationLabel,
  sanitizeNotificationText,
} from "./commerce-notifications-intelligence";
import { getNotificationTranslation } from "./commerce-notifications-i18n";
import {
  compareNotificationPriority,
  isUrgentRare,
  resolveNotificationPriority,
} from "./commerce-notifications-priority";
import {
  COMMERCE_NOTIFICATIONS_POLLING_MS,
  fallbackNotificationsEnvelope,
  shouldUseBff,
} from "./commerce-notifications-storage";

describe("commerce-notifications (20.80)", () => {
  it("defines all commerce event types", () => {
    expect(COMMERCE_NOTIFICATION_EVENT_TYPES.length).toBe(17);
    expect(COMMERCE_NOTIFICATION_EVENT_TYPES).not.toContain("LIKE" as never);
  });

  it("creates ORDER_CREATED notification", () => {
    const n = createCommerceNotification({
      eventType: "ORDER_CREATED",
      actorRole: "GROSSISTE_B",
      organizationId: "org-grossiste-b-demo",
    });
    expect(n.category).toBe("orders");
    expect(n.read).toBe(false);
  });

  it("creates DELIVERY_NEAR with urgent priority", () => {
    const n = createCommerceNotification({
      eventType: "DELIVERY_NEAR",
      actorRole: "DETAILLANT",
      organizationId: "org-detaillant-yopougon",
    });
    expect(resolveNotificationPriority(n.eventType)).toBe("URGENT");
  });

  it("creates SETTLEMENT_RECEIVED notification", () => {
    const n = createCommerceNotification({
      eventType: "SETTLEMENT_RECEIVED",
      actorRole: "GROSSISTE_B",
      organizationId: "org-x",
    });
    expect(n.category).toBe("settlements");
  });

  it("creates MESSAGE_RECEIVED notification", () => {
    const n = createCommerceNotification({
      eventType: "MESSAGE_RECEIVED",
      actorRole: "GROSSISTE_B",
      organizationId: "org-x",
    });
    expect(categoryForEventType("MESSAGE_RECEIVED")).toBe("messages");
  });

  it("creates MAIL_RECEIVED for producer", () => {
    const n = createCommerceNotification({
      eventType: "MAIL_RECEIVED",
      actorRole: "PRODUCER",
      organizationId: "org-producer",
    });
    expect(isEventAllowedForActor("MAIL_RECEIVED", "PRODUCER")).toBe(true);
    expect(n.eventType).toBe("MAIL_RECEIVED");
  });

  it("creates WALLET_LOCKED urgent", () => {
    const n = createCommerceNotification({
      eventType: "WALLET_LOCKED",
      actorRole: "GROSSISTE_B",
      organizationId: "org-x",
    });
    expect(n.priority).toBe("URGENT");
    expect(isUrgentRare("WALLET_LOCKED")).toBe(true);
  });

  it("rejects social meta", () => {
    expect(assertNotSocialEvent({ type: "like" })).toBe(false);
    expect(assertNotSocialEvent({ type: "order" })).toBe(true);
  });

  it("governance filters producer mail not detaillant spam", () => {
    const demo = buildDemoCommerceNotifications("PRODUCER", "org-p");
    const filtered = filterNotificationsForActor(
      demo,
      "PRODUCER",
      DEFAULT_COMMERCE_NOTIFICATION_PREFERENCES,
    );
    expect(filtered.every((n) => allowedEventTypesForActor(n.eventType, "PRODUCER"))).toBe(true);
  });

  it("terrain grossiste B gets messaging", () => {
    const demo = buildDemoCommerceNotifications("GROSSISTE_B", "org-b");
    expect(demo.some((n) => n.eventType === "MESSAGE_RECEIVED")).toBe(true);
  });

  it("formal grossiste A gets mail", () => {
    const demo = buildDemoCommerceNotifications("GROSSISTE_A", "org-a");
    expect(demo.some((n) => n.eventType === "MAIL_RECEIVED")).toBe(true);
  });

  it("preferences disable sponsored catalogs", () => {
    const n = createCommerceNotification({
      eventType: "SPONSORED_CATALOG_AVAILABLE",
      actorRole: "GROSSISTE_A",
      organizationId: "org-a",
    });
    expect(
      isNotificationEnabledByPreferences(n, {
        ...DEFAULT_COMMERCE_NOTIFICATION_PREFERENCES,
        sponsoredCatalogs: false,
      }),
    ).toBe(false);
  });

  it("mark read local", () => {
    const items = buildDemoCommerceNotifications("GROSSISTE_B", "org-b");
    const updated = markNotificationReadLocal(items, items[0]!.id);
    expect(updated[0]?.read).toBe(true);
  });

  it("mark all read local", () => {
    const items = buildDemoCommerceNotifications("DETAILLANT", "org-d");
    const updated = markAllNotificationsReadLocal(items);
    expect(updated.every((n) => n.read)).toBe(true);
  });

  it("sorts by priority", () => {
    const items = buildDemoCommerceNotifications("GROSSISTE_B", "org-b");
    const sorted = sortNotifications(items);
    expect(sorted[0]?.priority).toBe("URGENT");
    expect(compareNotificationPriority("LOW", "URGENT")).toBeGreaterThan(0);
  });

  it("center view model counts unread", () => {
    const items = buildDemoCommerceNotifications("GROSSISTE_B", "org-b");
    const vm = buildCenterViewModel(items, "GROSSISTE_B", DEFAULT_COMMERCE_NOTIFICATION_PREFERENCES);
    expect(vm.unreadCount).toBe(countUnread(vm.notifications));
  });

  it("buildNotificationLabel is commerce-first", () => {
    const n = createCommerceNotification({
      eventType: "ORDER_VALIDATED",
      actorRole: "GROSSISTE_B",
      organizationId: "org-x",
    });
    expect(buildNotificationLabel(n)).toMatch(/commande/i);
  });

  it("sanitize removes ERP jargon", () => {
    expect(sanitizeNotificationText("Alerte ERP dashboard")).not.toMatch(/erp/i);
  });

  it("sanitize removes social jargon", () => {
    expect(sanitizeNotificationText("Nouveau like")).not.toMatch(/like/i);
  });

  it("buildNotificationHint returns text", () => {
    const n = createCommerceNotification({
      eventType: "DELIVERY_NEAR",
      actorRole: "DETAILLANT",
      organizationId: "org-d",
    });
    expect(buildNotificationHint(n).length).toBeGreaterThan(3);
  });

  it("buildNotificationAction with context link", () => {
    const n = createCommerceNotification({
      eventType: "ORDER_VALIDATED",
      actorRole: "GROSSISTE_B",
      organizationId: "org-x",
      contextLink: { module: "order", orderId: "o1", activeModule: "order" },
    });
    expect(buildNotificationAction(n)?.label).toBeTruthy();
  });

  it("i18n fr-CI", () => {
    expect(getNotificationTranslation("notifications.events.ORDER_VALIDATED", "fr-CI")).toContain("validée");
  });

  it("i18n en", () => {
    expect(getNotificationTranslation("notifications.title", "en")).toContain("Commercial");
  });

  it("i18n ar", () => {
    expect(getNotificationTranslation("notifications.title", "ar")).toBeTruthy();
  });

  it("i18n zh-CN", () => {
    expect(getNotificationTranslation("notifications.title", "zh-CN")).toBeTruthy();
  });

  it("no polling interval", () => {
    expect(COMMERCE_NOTIFICATIONS_POLLING_MS).toBe(0);
  });

  it("shouldUseBff when flags enabled", () => {
    expect(
      shouldUseBff(
        { commerce_notifications_enabled: true, venext_bff_routes_enabled: true },
        true,
      ),
    ).toBe(true);
  });

  it("fallback envelope marks fallbackUsed", () => {
    const env = fallbackNotificationsEnvelope("GROSSISTE_B", "org-grossiste-b-demo");
    expect(env.fallbackUsed).toBe(true);
    expect(env.payload.length).toBeGreaterThan(0);
  });

  it("anti marketplace — no public feed events", () => {
    const types = COMMERCE_NOTIFICATION_EVENT_TYPES.join(",");
    expect(types).not.toMatch(/FOLLOW|LIKE|RANKING/i);
  });

  it("RELATION_REQUEST for terrain B", () => {
    expect(isEventAllowedForActor("RELATION_REQUEST", "GROSSISTE_B")).toBe(true);
    expect(isEventAllowedForActor("MAIL_RECEIVED", "DETAILLANT")).toBe(false);
  });

  it("CATALOG_AVAILABLE for detaillant", () => {
    expect(isEventAllowedForActor("CATALOG_AVAILABLE", "DETAILLANT")).toBe(true);
  });

  it("CONTEXT_RETURN_AVAILABLE low priority", () => {
    expect(resolveNotificationPriority("CONTEXT_RETURN_AVAILABLE")).toBe("LOW");
  });

  it("SETTLEMENT_PENDING urgent", () => {
    expect(resolveNotificationPriority("SETTLEMENT_PENDING")).toBe("URGENT");
  });

  it("detaillant demo has delivery confirmed", () => {
    const demo = buildDemoCommerceNotifications("DETAILLANT", "org-detaillant-yopougon");
    expect(demo.some((n) => n.eventType === "DELIVERY_CONFIRMED")).toBe(true);
  });

  it("producer demo has relation accepted", () => {
    const demo = buildDemoCommerceNotifications("PRODUCER", "org-producer-agronexus-ci");
    expect(demo.some((n) => n.eventType === "RELATION_ACCEPTED")).toBe(true);
  });

  it("grossiste A demo has catalog", () => {
    const demo = buildDemoCommerceNotifications("GROSSISTE_A", "org-grossiste-a-nord-plus");
    expect(demo.some((n) => n.eventType === "CATALOG_AVAILABLE")).toBe(true);
  });

  it("WALLET_SECURED normal not urgent spam", () => {
    expect(resolveNotificationPriority("WALLET_SECURED")).toBe("NORMAL");
  });

  it("ORDER_UPDATED urgent rare", () => {
    expect(isUrgentRare("ORDER_UPDATED")).toBe(true);
  });

  it("preferences default sponsored off", () => {
    expect(DEFAULT_COMMERCE_NOTIFICATION_PREFERENCES.sponsoredCatalogs).toBe(false);
  });

  it("preferences orders on by default", () => {
    expect(DEFAULT_COMMERCE_NOTIFICATION_PREFERENCES.orders).toBe(true);
  });

  it("filter removes wrong actor", () => {
    const a = createCommerceNotification({
      eventType: "ORDER_CREATED",
      actorRole: "PRODUCER",
      organizationId: "org-p",
    });
    const b = createCommerceNotification({
      eventType: "ORDER_CREATED",
      actorRole: "GROSSISTE_B",
      organizationId: "org-b",
    });
    const filtered = filterNotificationsForActor([a, b], "GROSSISTE_B", DEFAULT_COMMERCE_NOTIFICATION_PREFERENCES);
    expect(filtered).toHaveLength(1);
    expect(filtered[0]?.actorRole).toBe("GROSSISTE_B");
  });
});
