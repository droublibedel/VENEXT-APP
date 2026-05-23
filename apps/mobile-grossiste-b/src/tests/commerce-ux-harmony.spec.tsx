import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import {
  auditVisibleCopy,
  evaluateNavigationHarmony,
  getEmptyStateMessage,
  getErrorStateMessage,
  maxQuickActionsForPlatform,
  VenextCommerceEmptyState,
} from "commerce-ux-harmony";

describe("grossiste B commerce UX harmony", () => {
  afterEach(() => cleanup());

  it("mobile navigation depth 1 passes", () => {
    expect(evaluateNavigationHarmony({ platform: "mobile", depth: 1 }).ok).toBe(true);
  });

  it("max 5 quick actions on mobile", () => {
    expect(maxQuickActionsForPlatform("mobile")).toBe(5);
  });

  it("empty orders message is commerce-first", () => {
    expect(auditVisibleCopy(getEmptyStateMessage("orders")).ok).toBe(true);
  });

  it("wallet error avoids fintech jargon", () => {
    const msg = getErrorStateMessage("wallet_inactive");
    expect(msg.toLowerCase()).not.toContain("crypto");
    expect(auditVisibleCopy(msg).ok).toBe(true);
  });

  it("renders harmonized empty notifications", () => {
    render(<VenextCommerceEmptyState stateKey="notifications" />);
    expect(screen.getByRole("status")).toBeTruthy();
  });

  it("anti jargon rejects workflow", () => {
    expect(auditVisibleCopy("workflow commande").ok).toBe(false);
  });

  it("rtl ar empty generic", () => {
    expect(getEmptyStateMessage("generic", "ar").length).toBeGreaterThan(2);
  });

  it("offline empty state copy", () => {
    expect(getEmptyStateMessage("offline")).toMatch(/synchronisation/i);
  });
});
