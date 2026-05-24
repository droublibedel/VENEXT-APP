/** @vitest-environment jsdom */
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { DetaillantLocationBridge } from "../location/DetaillantLocationBridge";

vi.mock("commercial-location-terrain", async (importOriginal) => {
  const actual = await importOriginal<typeof import("commercial-location-terrain")>();
  return {
    ...actual,
    hasExploitableLocation: vi.fn(() => true),
    shouldShowTransientLocationHint: vi.fn(() => false),
  };
});

vi.mock("../onboarding/detaillant-onboarding.viewmodel", () => ({
  loadDetaillantOnboardingProfile: () => ({
    city: "Abidjan",
    organizationId: "org-detaillant-0701020304",
  }),
}));

describe("DetaillantLocationBridge", () => {
  afterEach(() => cleanup());

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("does not render persistent location banner when city is known", () => {
    render(<DetaillantLocationBridge />);
    expect(screen.queryByTestId("transient-location-hint")).toBeNull();
    expect(screen.queryByTestId("soft-commercial-location")).toBeNull();
  });
});
