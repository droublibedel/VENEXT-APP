import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import {
  auditVisibleCopy,
  getEmptyStateMessage,
  getErrorStateMessage,
  maxQuickActionsForPlatform,
  VenextCommerceEmptyState,
  VenextCommerceErrorState,
} from "commerce-ux-harmony";

describe("detaillant commerce UX harmony", () => {
  afterEach(() => cleanup());

  it("mobile max 5 quick actions rule", () => {
    expect(maxQuickActionsForPlatform("mobile")).toBe(5);
  });

  it("catalog empty copy", () => {
    expect(getEmptyStateMessage("catalog")).toMatch(/catalogue/i);
  });

  it("renders deliveries empty", () => {
    render(<VenextCommerceEmptyState stateKey="deliveries" />);
    expect(screen.getByText(/livraison/i)).toBeTruthy();
  });

  it("rejects supply chain wording", () => {
    expect(auditVisibleCopy("supply chain visibility").ok).toBe(false);
  });

  it("session locked error human", () => {
    render(<VenextCommerceErrorState stateKey="session_locked" />);
    expect(screen.getByRole("alert")).toBeTruthy();
  });

  it("wallet inactive message", () => {
    expect(getErrorStateMessage("wallet_inactive").toLowerCase()).toContain("règlement");
  });
});
