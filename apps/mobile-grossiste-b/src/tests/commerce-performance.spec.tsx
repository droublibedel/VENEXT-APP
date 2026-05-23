import { describe, expect, it } from "vitest";

import {
  assertManualRefreshOnly,
  assertNoWebsocketInStack,
  auditFeatureFlagConsistency,
  paginateLight,
  sliceVisibleWindow,
} from "commerce-performance-foundation";

import { COMMERCE_NOTIFICATIONS_POLLING_MS } from "commerce-notifications";

describe("grossiste B performance (20.85)", () => {
  it("notifications polling disabled", () => {
    expect(COMMERCE_NOTIFICATIONS_POLLING_MS).toBe(0);
    expect(assertManualRefreshOnly(COMMERCE_NOTIFICATIONS_POLLING_MS)).toBe(true);
  });

  it("no websocket in fetch stack", () => {
    expect(assertNoWebsocketInStack("fetch /api/notifications")).toBe(true);
  });

  it("paginate orders list", () => {
    const r = paginateLight(Array.from({ length: 30 }, (_, i) => i), 1, 20);
    expect(r.items).toHaveLength(20);
  });

  it("slice activity window", () => {
    expect(sliceVisibleWindow([1, 2, 3, 4, 5], 3)).toEqual([1, 2, 3]);
  });

  it("feature flags audit passes for dev defaults", () => {
    const r = auditFeatureFlagConsistency({
      commerce_notifications_enabled: true,
      venext_bff_routes_enabled: true,
      commerce_offline_foundation_enabled: true,
    });
    expect(r.ok).toBe(true);
  });
});
