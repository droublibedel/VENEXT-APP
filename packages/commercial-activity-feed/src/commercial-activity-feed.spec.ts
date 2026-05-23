import { describe, expect, it } from "vitest";

import { openActivityContext } from "./commercial-activity-feed-center";
import {
  COMMERCIAL_ACTIVITY_EVENT_TYPES,
  assertNotSocialActivity,
  buildDemoCommercialActivityFeed,
  categoryForActivity,
  createCommercialActivity,
} from "./commercial-activity-feed-events";
import {
  allowedEventsForActor,
  filterActivitiesForViewer,
  isActivityVisibleForRelationship,
  isPartnerOnlyActivity,
} from "./commercial-activity-feed-governance";
import {
  buildActivityLabel,
  buildActivitySummaryText,
  buildGroupLabel,
  sanitizeActivityText,
} from "./commercial-activity-feed-intelligence";
import { getActivityTranslation } from "./commercial-activity-feed-i18n";
import { buildActivityGroups } from "./commercial-activity-feed-grouping";
import {
  buildActivitySummary,
  buildActivityTimeline,
  resolveTimelineBucket,
} from "./commercial-activity-feed-timeline";
import {
  COMMERCIAL_ACTIVITY_FEED_POLLING_MS,
  COMMERCIAL_ACTIVITY_MAX_HISTORY_DAYS,
} from "./commercial-activity-feed.types";
import {
  fallbackActivityEnvelope as fallbackEnv,
  shouldUseActivityBff,
} from "./commercial-activity-feed-storage";

const flagsOn = {
  commercial_activity_feed_enabled: true,
  commercial_relationship_governance_enabled: true,
  venext_bff_routes_enabled: true,
};

describe("commercial-activity-feed (20.81)", () => {
  it("defines 15 commerce event types", () => {
    expect(COMMERCIAL_ACTIVITY_EVENT_TYPES.length).toBe(15);
    expect(COMMERCIAL_ACTIVITY_EVENT_TYPES).not.toContain("LIKE" as never);
  });

  it("creates ORDER_CREATED activity", () => {
    const a = createCommercialActivity({
      eventType: "ORDER_CREATED",
      actorRole: "GROSSISTE_B",
      organizationId: "org-x",
    });
    expect(a.category).toBe("orders");
    expect(a.read).toBe(false);
  });

  it("creates DELIVERY_CONFIRMED activity", () => {
    expect(categoryForActivity("DELIVERY_CONFIRMED")).toBe("deliveries");
  });

  it("creates SETTLEMENT_RECEIVED activity", () => {
    const a = createCommercialActivity({
      eventType: "SETTLEMENT_RECEIVED",
      actorRole: "GROSSISTE_B",
      organizationId: "org-x",
    });
    expect(a.category).toBe("settlements");
  });

  it("creates MESSAGE_ACTIVITY", () => {
    expect(categoryForActivity("MESSAGE_ACTIVITY")).toBe("messages");
  });

  it("creates MAIL_SENT for producer", () => {
    expect(allowedEventsForActor("PRODUCER").has("MAIL_SENT")).toBe(true);
  });

  it("creates WALLET_SECURED", () => {
    const a = createCommercialActivity({
      eventType: "WALLET_SECURED",
      actorRole: "GROSSISTE_B",
      organizationId: "org-x",
    });
    expect(a.category).toBe("wallet");
  });

  it("rejects social meta", () => {
    expect(assertNotSocialActivity({ note: "like" })).toBe(false);
    expect(assertNotSocialActivity({ note: "order" })).toBe(true);
  });

  it("governance filters grossiste B events", () => {
    const demo = buildDemoCommercialActivityFeed("GROSSISTE_B", "org-grossiste-b-demo");
    const filtered = filterActivitiesForViewer(demo, "GROSSISTE_B", "org-grossiste-b-demo", "all", flagsOn);
    expect(filtered.every((i) => allowedEventsForActor("GROSSISTE_B").has(i.eventType))).toBe(true);
  });

  it("detaillant does not see NETWORK_ACTIVITY", () => {
    const item = createCommercialActivity({
      eventType: "NETWORK_ACTIVITY",
      actorRole: "PRODUCER",
      organizationId: "org-p",
    });
    const out = filterActivitiesForViewer([item], "DETAILLANT", "org-d", "all", flagsOn);
    expect(out.length).toBe(0);
  });

  it("partner-only activity detection", () => {
    const item = createCommercialActivity({
      eventType: "ORDER_CREATED",
      actorRole: "GROSSISTE_B",
      organizationId: "org-x",
      relationshipId: "rel-1",
    });
    expect(isPartnerOnlyActivity(item)).toBe(true);
  });

  it("relationship visibility when governance on", () => {
    const item = createCommercialActivity({
      eventType: "ORDER_CREATED",
      actorRole: "GROSSISTE_B",
      organizationId: "org-x",
      relationshipId: "rel-1",
    });
    expect(isActivityVisibleForRelationship(item, "GROSSISTE_B", flagsOn)).toBe(true);
  });

  it("filters by orders category", () => {
    const demo = buildDemoCommercialActivityFeed("GROSSISTE_B", "org-grossiste-b-demo");
    const orders = filterActivitiesForViewer(demo, "GROSSISTE_B", "org-grossiste-b-demo", "orders", flagsOn);
    expect(orders.every((i) => i.category === "orders")).toBe(true);
  });

  it("buildActivityGroups aggregates orders", () => {
    const demo = buildDemoCommercialActivityFeed("GROSSISTE_B", "org-grossiste-b-demo");
    const groups = buildActivityGroups(demo, true);
    expect(groups.some((g) => g.category === "orders")).toBe(true);
    expect(groups[0]?.count).toBeGreaterThan(0);
  });

  it("grouping disabled returns empty groups", () => {
    const demo = buildDemoCommercialActivityFeed("GROSSISTE_B", "org-x");
    expect(buildActivityGroups(demo, false)).toEqual([]);
  });

  it("buildActivityTimeline has today bucket", () => {
    const demo = buildDemoCommercialActivityFeed("GROSSISTE_B", "org-x");
    const timeline = buildActivityTimeline(demo, true);
    expect(timeline.some((s) => s.bucket === "today")).toBe(true);
  });

  it("resolveTimelineBucket for yesterday", () => {
    const iso = new Date(Date.now() - 25 * 3600_000).toISOString();
    expect(resolveTimelineBucket(iso)).toBe("yesterday");
  });

  it("buildActivitySummary headline busy orders", () => {
    const items = Array.from({ length: 4 }, (_, i) =>
      createCommercialActivity({
        eventType: "ORDER_CREATED",
        actorRole: "GROSSISTE_B",
        organizationId: "org-x",
        occurredAt: new Date().toISOString(),
      }),
    );
    const s = buildActivitySummary(items, "org-x");
    expect(s.headlineKey).toBe("activity.summary.orders_busy");
  });

  it("30 day history limit excludes old items", () => {
    const old = createCommercialActivity({
      eventType: "ORDER_CREATED",
      actorRole: "GROSSISTE_B",
      organizationId: "org-x",
      occurredAt: new Date(Date.now() - 40 * 86_400_000).toISOString(),
    });
    const out = filterActivitiesForViewer([old], "GROSSISTE_B", "org-x", "all", flagsOn);
    expect(out.length).toBe(0);
    expect(COMMERCIAL_ACTIVITY_MAX_HISTORY_DAYS).toBe(30);
  });

  it("no websocket polling interval", () => {
    expect(COMMERCIAL_ACTIVITY_FEED_POLLING_MS).toBe(0);
  });

  it("anti social sanitize strips viral", () => {
    expect(sanitizeActivityText("trending viral feed")).not.toMatch(/viral/i);
  });

  it("anti ERP sanitize strips dashboard", () => {
    expect(sanitizeActivityText("ERP dashboard kpi")).not.toMatch(/dashboard/i);
  });

  it("i18n FR title", () => {
    expect(getActivityTranslation("activity.title", "fr-CI")).toContain("commerciale");
  });

  it("i18n EN title", () => {
    expect(getActivityTranslation("activity.title", "en")).toBe("Commercial activity");
  });

  it("i18n AR RTL locale key", () => {
    expect(getActivityTranslation("activity.timeline.today", "ar")).toBe("اليوم");
  });

  it("i18n ZH title", () => {
    expect(getActivityTranslation("activity.title", "zh-CN")).toBe("商业动态");
  });

  it("buildActivityLabel sanitizes", () => {
    const item = createCommercialActivity({
      eventType: "ORDER_CREATED",
      actorRole: "GROSSISTE_B",
      organizationId: "org-x",
      meta: { note: "ok" },
    });
    expect(buildActivityLabel(item, "fr-CI").length).toBeGreaterThan(0);
  });

  it("buildGroupLabel replaces count", () => {
    expect(buildGroupLabel("activity.groups.orders", 3, "fr-CI")).toContain("3");
  });

  it("buildActivitySummaryText interpolates", () => {
    const t = buildActivitySummaryText("activity.summary.orders_busy", "fr-CI");
    expect(t.length).toBeGreaterThan(0);
  });

  it("shouldUseActivityBff when flags hydrated", () => {
    expect(shouldUseActivityBff(flagsOn, true)).toBe(true);
    expect(shouldUseActivityBff({ ...flagsOn, venext_bff_routes_enabled: false }, true)).toBe(false);
  });

  it("fallback envelope marks dev", () => {
    const env = fallbackEnv("GROSSISTE_B", "org-demo");
    expect(env.fallbackUsed).toBe(true);
    expect(env.payload.length).toBeGreaterThan(0);
  });

  it("producer demo has network activity", () => {
    const demo = buildDemoCommercialActivityFeed("PRODUCER", "org-producer");
    expect(demo.some((i) => i.eventType === "NETWORK_ACTIVITY")).toBe(true);
  });

  it("grossiste A demo has partner activity", () => {
    const demo = buildDemoCommercialActivityFeed("GROSSISTE_A", "org-ga");
    expect(demo.some((i) => i.eventType === "PARTNER_ACTIVITY")).toBe(true);
  });

  it("detaillant demo is lightweight", () => {
    const demo = buildDemoCommercialActivityFeed("DETAILLANT", "org-d");
    expect(demo.length).toBeLessThanOrEqual(6);
    expect(demo.some((i) => i.eventType === "MESSAGE_ACTIVITY")).toBe(true);
  });

  it("openActivityContext navigates order", () => {
    const navigated: string[] = [];
    const router = {
      navigate: (id: string) => {
        navigated.push(id);
      },
    };
    const item = createCommercialActivity({
      eventType: "ORDER_CREATED",
      actorRole: "GROSSISTE_B",
      organizationId: "org-x",
      contextLink: { module: "order", orderId: "o-1", activeModule: "order" },
    });
    expect(openActivityContext(router, item, flagsOn)).toBe(true);
    expect(navigated[0]).toBe("messaging-to-order");
  });

  it("openActivityContext false without link", () => {
    const router = { navigate: () => undefined };
    const item = createCommercialActivity({
      eventType: "ORDER_CREATED",
      actorRole: "GROSSISTE_B",
      organizationId: "org-x",
    });
    expect(openActivityContext(router, item, flagsOn)).toBe(false);
  });

  it("openActivityContext delivery transition", () => {
    const navigated: string[] = [];
    const item = createCommercialActivity({
      eventType: "DELIVERY_STARTED",
      actorRole: "GROSSISTE_B",
      organizationId: "org-x",
      contextLink: { module: "delivery", deliveryId: "d-1", activeModule: "delivery" },
    });
    openActivityContext({ navigate: (id) => navigated.push(id) }, item, flagsOn);
    expect(navigated[0]).toBe("order-to-delivery");
  });

  it("openActivityContext messaging transition", () => {
    const navigated: string[] = [];
    const item = createCommercialActivity({
      eventType: "MESSAGE_ACTIVITY",
      actorRole: "GROSSISTE_B",
      organizationId: "org-x",
      contextLink: { module: "messaging", conversationId: "c-1", activeModule: "messaging" },
    });
    openActivityContext({ navigate: (id) => navigated.push(id) }, item, flagsOn);
    expect(navigated[0]).toBe("order-to-messaging");
  });

  it("filters wallet category for grossiste B", () => {
    const item = createCommercialActivity({
      eventType: "WALLET_ACTIVATED",
      actorRole: "GROSSISTE_B",
      organizationId: "org-grossiste-b-demo",
    });
    const out = filterActivitiesForViewer(
      [item],
      "GROSSISTE_B",
      "org-grossiste-b-demo",
      "wallet",
      flagsOn,
    );
    expect(out.length).toBe(1);
  });

  it("filters mails for producer", () => {
    const demo = buildDemoCommercialActivityFeed("PRODUCER", "org-p");
    const mails = filterActivitiesForViewer(demo, "PRODUCER", "org-p", "mails", flagsOn);
    expect(mails.every((i) => i.category === "mails")).toBe(true);
  });

  it("no public feed event types", () => {
    const forbidden = ["FOLLOW", "LIKE", "COMMENT", "TRENDING"];
    for (const f of forbidden) {
      expect(COMMERCIAL_ACTIVITY_EVENT_TYPES).not.toContain(f as never);
    }
  });

  it("no infinite timeline buckets only four", () => {
    const demo = buildDemoCommercialActivityFeed("GROSSISTE_B", "org-x");
    const buckets = new Set(demo.map((i) => resolveTimelineBucket(i.occurredAt)));
    expect([...buckets].every((b) => ["today", "yesterday", "this_week", "older"].includes(b))).toBe(true);
  });

  it("shouldUseActivityBff false when feed disabled", () => {
    expect(shouldUseActivityBff({ commercial_activity_feed_enabled: false }, true)).toBe(false);
  });

  it("createCommercialActivity throws on social meta", () => {
    expect(() =>
      createCommercialActivity({
        eventType: "ORDER_CREATED",
        actorRole: "GROSSISTE_B",
        organizationId: "org-x",
        meta: { reaction: "like" },
      }),
    ).toThrow();
  });

  it("RELATION_ESTABLISHED is partners category", () => {
    expect(categoryForActivity("RELATION_ESTABLISHED")).toBe("partners");
  });

  it("SPONSORED_PRODUCT_VISIBLE hidden meta filtered", () => {
    const item = createCommercialActivity({
      eventType: "SPONSORED_PRODUCT_VISIBLE",
      actorRole: "GROSSISTE_B",
      organizationId: "org-x",
      meta: { sponsored: "hidden" },
    });
    const out = filterActivitiesForViewer([item], "GROSSISTE_B", "org-x", "all", flagsOn);
    expect(out.length).toBe(0);
  });

  it("timeline sections include groups when enabled", () => {
    const demo = buildDemoCommercialActivityFeed("GROSSISTE_B", "org-x");
    const sections = buildActivityTimeline(demo, true);
    expect(sections[0]?.groups.length).toBeGreaterThan(0);
  });

  it("summary quiet by default for empty", () => {
    const s = buildActivitySummary([], "org-x");
    expect(s.headlineKey).toBe("activity.summary.quiet");
  });
});
