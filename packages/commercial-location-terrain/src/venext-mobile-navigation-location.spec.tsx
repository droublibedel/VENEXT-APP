/** @vitest-environment jsdom */
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { shouldShowTransientLocationHint } from "./soft-location-prompt-policy";

vi.mock("./commercial-location-storage.js", () => ({
  hasExploitableLocation: vi.fn(() => false),
  wasSoftLocationPromptDismissed: vi.fn(() => false),
}));

describe("soft location prompt policy (VENEXT-MOBILE-NAVIGATION-02)", () => {
  afterEach(() => cleanup());

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("suppresses transient hint when onboarding city is set", () => {
    expect(
      shouldShowTransientLocationHint("actor-1", {
        onboardingDone: true,
        sessionCount: 2,
        sessionKey: "post_onboarding",
        hasOnboardingCity: true,
      }),
    ).toBe(false);
  });

  it("shows transient hint only when location is incomplete", () => {
    expect(
      shouldShowTransientLocationHint("actor-1", {
        onboardingDone: true,
        sessionCount: 2,
        sessionKey: "post_onboarding",
        hasOnboardingCity: false,
      }),
    ).toBe(true);
  });
});

describe("TransientLocationOptimizationHint", () => {
  afterEach(() => cleanup());

  it("auto-dismisses after visible period", async () => {
    vi.useFakeTimers();
    const { TransientLocationOptimizationHint } = await import("./TransientLocationOptimizationHint");
    render(
      <TransientLocationOptimizationHint message="Ajoutez votre ville pour améliorer votre réseau." visibleMs={500} />,
    );
    expect(screen.getByTestId("transient-location-hint")).toBeTruthy();
    vi.advanceTimersByTime(600);
    await vi.runAllTimersAsync();
    expect(screen.queryByTestId("transient-location-hint")).toBeNull();
    vi.useRealTimers();
  });
});
