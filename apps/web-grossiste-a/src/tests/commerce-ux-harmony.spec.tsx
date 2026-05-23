import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  auditVisibleCopy,
  evaluateNavigationHarmony,
  getErrorStateMessage,
  VenextCommerceErrorState,
} from "commerce-ux-harmony";

import { GrossisteAAppShell } from "../app-shell/GrossisteAAppShell";

vi.mock("../hooks/useGrossisteAFeatureFlags", () => ({
  useGrossisteAFeatureFlags: () => ({
    flags: {
      grossiste_a_web_enabled: true,
      commerce_ux_harmony_enabled: true,
      commerce_notifications_enabled: false,
      commerce_offline_foundation_enabled: false,
    },
    hydrated: true,
  }),
}));

describe("grossiste A web UX harmony", () => {
  afterEach(() => cleanup());

  it("renders formal web shell", () => {
    render(<GrossisteAAppShell />);
    expect(screen.getByTestId("grossiste-a-app")).toBeTruthy();
  });

  it("navigation depth 2 allowed on web", () => {
    expect(evaluateNavigationHarmony({ platform: "web", depth: 2, hasQuickReturn: true }).ok).toBe(
      true,
    );
  });

  it("access denied human copy", () => {
    expect(getErrorStateMessage("access_denied").toLowerCase()).toContain("partenaire");
  });

  it("renders offline error banner", () => {
    render(<VenextCommerceErrorState stateKey="offline" />);
    expect(screen.getByRole("alert")).toBeTruthy();
  });

  it("rejects ERP dashboard label", () => {
    expect(auditVisibleCopy("ERP dashboard").ok).toBe(false);
  });
});
