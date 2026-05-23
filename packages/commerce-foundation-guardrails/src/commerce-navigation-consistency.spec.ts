import { describe, expect, it } from "vitest";

import {
  assertSingleActivePanel,
  buildCommerceNavigationConsistency,
  mergeCommerceNavigationContext,
} from "./commerce-foundation-navigation.guard";

const FLAGS = { commerce_navigation_consistency_enabled: true };

describe("commerce navigation consistency (20.74-A)", () => {
  it("passes shallow navigation", () => {
    const r = buildCommerceNavigationConsistency(
      mergeCommerceNavigationContext("orders", "settlement"),
      FLAGS,
    );
    expect(r.ok).toBe(true);
  });

  it("fails deep navigation", () => {
    const r = buildCommerceNavigationConsistency(
      { activePrimaryPanel: "a", depth: 4, hasQuickReturn: false },
      FLAGS,
    );
    expect(r.ok).toBe(false);
    expect(r.violations).toContain("navigation-too-deep");
  });

  it("fails workflow tunnel", () => {
    const r = buildCommerceNavigationConsistency(
      { activePrimaryPanel: "a", tunnelSteps: 3 },
      FLAGS,
    );
    expect(r.violations).toContain("workflow-tunnel");
  });

  it("fails heavy modals", () => {
    const r = buildCommerceNavigationConsistency(
      { activePrimaryPanel: "a", modalCount: 2 },
      FLAGS,
    );
    expect(r.violations).toContain("heavy-modals");
  });

  it("requires quick return when nested", () => {
    const r = buildCommerceNavigationConsistency(
      { activePrimaryPanel: "a", secondaryContext: "b", depth: 2, hasQuickReturn: false },
      FLAGS,
    );
    expect(r.violations).toContain("missing-quick-return");
  });

  it("assertSingleActivePanel allows one", () => {
    expect(assertSingleActivePanel(["status"])).toBe(true);
    expect(assertSingleActivePanel(["a", "b"])).toBe(false);
  });

  it("skips checks when flag off", () => {
    const r = buildCommerceNavigationConsistency(
      { activePrimaryPanel: "a", depth: 9, modalCount: 5 },
      { commerce_navigation_consistency_enabled: false },
    );
    expect(r.ok).toBe(true);
  });
});
