/** @vitest-environment jsdom */
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { GROSSISTE_B_ONBOARDING_STORAGE_KEY } from "./grossiste-b-onboarding.types";
import { TERRAIN_PROFILE_STORAGE_KEY } from "commerce-terrain-profile-runtime";
import { GrossisteBQuickOnboarding } from "./GrossisteBQuickOnboarding";
import {
  createEmptyGrossisteBProfile,
  isGrossisteBOnboardingComplete,
  loadGrossisteBOnboardingProfile,
  MOCK_OTP_CODE,
  saveGrossisteBOnboardingProfile,
  clearGrossisteBOnboardingProfile,
  validateGrossisteBOtp,
  validateGrossisteBPhone,
} from "./grossiste-b-onboarding.viewmodel";

async function goPastTerrainProfileStep() {
  if (!screen.queryByTestId("terrain-profile-selection")) return;
  fireEvent.click(screen.getByTestId("terrain-profile-option-grossiste-b"));
  fireEvent.click(screen.getByTestId("terrain-profile-continue"));
  await waitFor(() => expect(screen.getByTestId("gb-onboarding-phone")).toBeTruthy());
}

async function completeGrossisteBOnboarding() {
  await goPastTerrainProfileStep();
  fireEvent.change(screen.getByTestId("gb-onboarding-phone-input"), {
    target: { value: "0700000002" },
  });
  fireEvent.click(screen.getByTestId("gb-onboarding-otp-auto"));
  fireEvent.click(screen.getByTestId("gb-onboarding-phone-next"));
  await waitFor(() => expect(screen.getByTestId("gb-onboarding-identity")).toBeTruthy());
  fireEvent.change(screen.getByTestId("gb-onboarding-display-name"), { target: { value: "Moussa" } });
  fireEvent.click(screen.getByTestId("gb-onboarding-identity-next"));
  await waitFor(() => expect(screen.getByTestId("gb-onboarding-activities")).toBeTruthy());
  fireEvent.click(screen.getByTestId("gb-onboarding-activity-sucre"));
  fireEvent.click(screen.getByTestId("gb-onboarding-activities-next"));
  await waitFor(() => expect(screen.getByTestId("gb-onboarding-city")).toBeTruthy());
  fireEvent.click(screen.getByTestId("gb-onboarding-city-abidjan"));
  fireEvent.click(screen.getByTestId("gb-onboarding-finish"));
}

afterEach(() => {
  cleanup();
  localStorage.removeItem(GROSSISTE_B_ONBOARDING_STORAGE_KEY);
  localStorage.removeItem(TERRAIN_PROFILE_STORAGE_KEY);
});

describe("grossiste B onboarding viewmodel", () => {
  it("validates phone", () => {
    expect(validateGrossisteBPhone("07")).toBe(false);
    expect(validateGrossisteBPhone("0701020304")).toBe(true);
  });

  it("validates OTP mock", () => {
    expect(validateGrossisteBOtp(MOCK_OTP_CODE)).toBe(true);
  });

  it("saves and loads profile", () => {
    saveGrossisteBOnboardingProfile({
      ...createEmptyGrossisteBProfile(),
      phone: "0700000007",
      otpVerified: true,
      displayName: "Moussa",
      activities: ["Sucre"],
      city: "Abidjan",
    });
    expect(loadGrossisteBOnboardingProfile()?.displayName).toBe("Moussa");
  });

  it("clears profile on logout", () => {
    saveGrossisteBOnboardingProfile({
      ...createEmptyGrossisteBProfile(),
      phone: "0700000007",
      otpVerified: true,
      displayName: "Moussa",
      activities: ["Sucre"],
      city: "Abidjan",
    });
    clearGrossisteBOnboardingProfile();
    expect(loadGrossisteBOnboardingProfile()).toBeNull();
    expect(isGrossisteBOnboardingComplete()).toBe(false);
  });
});

describe("grossiste B quick onboarding flow", () => {
  beforeEach(() => {
    localStorage.removeItem(GROSSISTE_B_ONBOARDING_STORAGE_KEY);
    localStorage.removeItem(TERRAIN_PROFILE_STORAGE_KEY);
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo) => {
        const url = String(input);
        if (url.includes("/api/grossiste-b/onboarding/complete")) {
          return new Response(
            JSON.stringify({
              ok: true,
              organizationId: "org-grossiste-b-7000000002",
              profile: { displayName: "Moussa" },
            }),
            { status: 200, headers: { "Content-Type": "application/json" } },
          );
        }
        return new Response(JSON.stringify({ ok: false }), { status: 404 });
      }),
    );
  });

  it("starts with profile selection when no primary profile", async () => {
    render(<GrossisteBQuickOnboarding onComplete={vi.fn()} />);
    await waitFor(() => expect(screen.getByTestId("terrain-profile-selection")).toBeTruthy());
    expect(screen.getByTestId("gb-onboarding-progress").textContent).toContain("1 / 5");
  });

  it("uses single display name field without business name", async () => {
    render(<GrossisteBQuickOnboarding onComplete={vi.fn()} />);
    await goPastTerrainProfileStep();
    fireEvent.change(screen.getByTestId("gb-onboarding-phone-input"), {
      target: { value: "0700000000" },
    });
    fireEvent.click(screen.getByTestId("gb-onboarding-otp-auto"));
    fireEvent.click(screen.getByTestId("gb-onboarding-phone-next"));
    await waitFor(() => expect(screen.getByTestId("gb-onboarding-display-name")).toBeTruthy());
    expect(screen.queryByTestId("gb-onboarding-business-name")).toBeNull();
  });

  it("completes onboarding via API and stores organizationId", async () => {
    const onComplete = vi.fn();
    render(<GrossisteBQuickOnboarding onComplete={onComplete} />);
    await completeGrossisteBOnboarding();
    await waitFor(() => expect(onComplete).toHaveBeenCalled());
    expect(loadGrossisteBOnboardingProfile()?.organizationId).toBe("org-grossiste-b-7000000002");
    expect(screen.queryByTestId("gb-quick-onboarding-audio")).toBeNull();
  });

  it("does not show logo or photo upload", async () => {
    render(<GrossisteBQuickOnboarding onComplete={vi.fn()} />);
    await goPastTerrainProfileStep();
    expect(screen.queryByTestId("gb-onboarding-logo")).toBeNull();
    expect(screen.queryByTestId("gb-onboarding-photo")).toBeNull();
  });
});
