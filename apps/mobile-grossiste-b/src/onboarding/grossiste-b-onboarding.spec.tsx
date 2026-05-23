/** @vitest-environment jsdom */
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { GrossisteBQuickOnboarding } from "./GrossisteBQuickOnboarding";
import { GROSSISTE_B_ONBOARDING_STORAGE_KEY } from "./grossiste-b-onboarding.types";
import {
  createEmptyGrossisteBProfile,
  isGrossisteBOnboardingComplete,
  loadGrossisteBOnboardingProfile,
  MOCK_OTP_CODE,
  saveGrossisteBOnboardingProfile,
  validateGrossisteBPhone,
  validateGrossisteBOtp,
} from "./grossiste-b-onboarding.viewmodel";

vi.mock("../hooks/useGrossisteFeatureFlags", () => ({
  useGrossisteFeatureFlags: () => ({
    flags: { terrain_quick_onboarding_enabled: true, terrain_pseudo_identity_enabled: true },
    hydrated: true,
  }),
}));

async function completeGrossisteBOnboarding() {
  fireEvent.change(screen.getByTestId("gb-onboarding-phone-input"), {
    target: { value: "+2250700000001" },
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
});

describe("grossiste B onboarding viewmodel", () => {
  it("validates phone with at least 8 digits", () => {
    expect(validateGrossisteBPhone("+225 07")).toBe(false);
    expect(validateGrossisteBPhone("+22507000000")).toBe(true);
  });

  it("accepts mock OTP code", () => {
    expect(validateGrossisteBOtp(MOCK_OTP_CODE)).toBe(true);
    expect(validateGrossisteBOtp("000000")).toBe(false);
  });

  it("persists profile to localStorage", () => {
    const profile = {
      ...createEmptyGrossisteBProfile(),
      phone: "+22507",
      otpVerified: true,
      displayName: "Sarah grossiste",
      city: "Bouaké",
      activities: ["Boissons"],
    };
    saveGrossisteBOnboardingProfile(profile);
    const loaded = loadGrossisteBOnboardingProfile();
    expect(loaded?.displayName).toBe("Sarah grossiste");
    expect(loaded?.completedAt).toBeTruthy();
  });

  it("detects incomplete onboarding", () => {
    expect(isGrossisteBOnboardingComplete()).toBe(false);
  });
});

describe("grossiste B quick onboarding flow", () => {
  beforeEach(() => {
    localStorage.removeItem(GROSSISTE_B_ONBOARDING_STORAGE_KEY);
  });

  it("starts on phone step", async () => {
    render(<GrossisteBQuickOnboarding onComplete={vi.fn()} />);
    await waitFor(() => expect(screen.getByTestId("gb-onboarding-phone")).toBeTruthy());
    expect(screen.getByTestId("gb-onboarding-progress").textContent).toContain("1 / 4");
  });

  it("supports OTP auto-read simulation", async () => {
    render(<GrossisteBQuickOnboarding onComplete={vi.fn()} />);
    fireEvent.change(screen.getByTestId("gb-onboarding-phone-input"), {
      target: { value: "+2250700000000" },
    });
    fireEvent.click(screen.getByTestId("gb-onboarding-otp-auto"));
    fireEvent.click(screen.getByTestId("gb-onboarding-phone-next"));
    await waitFor(() => expect(screen.getByTestId("gb-onboarding-identity")).toBeTruthy());
  });

  it("uses single display name field (no split name fields)", async () => {
    render(<GrossisteBQuickOnboarding onComplete={vi.fn()} />);
    fireEvent.change(screen.getByTestId("gb-onboarding-phone-input"), {
      target: { value: "+2250700000000" },
    });
    fireEvent.click(screen.getByTestId("gb-onboarding-otp-auto"));
    fireEvent.click(screen.getByTestId("gb-onboarding-phone-next"));
    await waitFor(() => expect(screen.getByTestId("gb-onboarding-display-name")).toBeTruthy());
    expect(screen.queryByTestId("gb-onboarding-first-name")).toBeNull();
    expect(screen.queryByTestId("gb-onboarding-last-name")).toBeNull();
  });

  it("accepts simple pseudo Moussa", async () => {
    render(<GrossisteBQuickOnboarding onComplete={vi.fn()} />);
    fireEvent.change(screen.getByTestId("gb-onboarding-phone-input"), {
      target: { value: "+2250700000000" },
    });
    fireEvent.click(screen.getByTestId("gb-onboarding-otp-auto"));
    fireEvent.click(screen.getByTestId("gb-onboarding-phone-next"));
    await waitFor(() => screen.getByTestId("gb-onboarding-display-name"));
    fireEvent.change(screen.getByTestId("gb-onboarding-display-name"), { target: { value: "Moussa" } });
    expect(screen.getByTestId("gb-onboarding-identity-next")).toHaveProperty("disabled", false);
  });

  it("accepts full name Aminata Traoré", async () => {
    render(<GrossisteBQuickOnboarding onComplete={vi.fn()} />);
    fireEvent.change(screen.getByTestId("gb-onboarding-phone-input"), {
      target: { value: "+2250700000000" },
    });
    fireEvent.click(screen.getByTestId("gb-onboarding-otp-auto"));
    fireEvent.click(screen.getByTestId("gb-onboarding-phone-next"));
    await waitFor(() => screen.getByTestId("gb-onboarding-display-name"));
    fireEvent.change(screen.getByTestId("gb-onboarding-display-name"), {
      target: { value: "Aminata Traoré" },
    });
    expect(screen.getByTestId("gb-onboarding-identity-next")).toHaveProperty("disabled", false);
  });

  it("keeps boutique name optional", async () => {
    render(<GrossisteBQuickOnboarding onComplete={vi.fn()} />);
    fireEvent.change(screen.getByTestId("gb-onboarding-phone-input"), {
      target: { value: "+2250700000000" },
    });
    fireEvent.click(screen.getByTestId("gb-onboarding-otp-auto"));
    fireEvent.click(screen.getByTestId("gb-onboarding-phone-next"));
    await waitFor(() => screen.getByTestId("gb-onboarding-display-name"));
    fireEvent.change(screen.getByTestId("gb-onboarding-display-name"), { target: { value: "Moussa" } });
    fireEvent.click(screen.getByTestId("gb-onboarding-identity-next"));
    await waitFor(() => expect(screen.getByTestId("gb-onboarding-activities")).toBeTruthy());
    expect(screen.queryByTestId("gb-onboarding-logo")).toBeNull();
  });

  it("allows optional boutique La Rue de la Mode", async () => {
    render(<GrossisteBQuickOnboarding onComplete={vi.fn()} />);
    fireEvent.change(screen.getByTestId("gb-onboarding-phone-input"), {
      target: { value: "+2250700000000" },
    });
    fireEvent.click(screen.getByTestId("gb-onboarding-otp-auto"));
    fireEvent.click(screen.getByTestId("gb-onboarding-phone-next"));
    await waitFor(() => screen.getByTestId("gb-onboarding-business-name"));
    fireEvent.change(screen.getByTestId("gb-onboarding-display-name"), { target: { value: "François" } });
    fireEvent.change(screen.getByTestId("gb-onboarding-business-name"), {
      target: { value: "La Rue de la Mode" },
    });
    fireEvent.click(screen.getByTestId("gb-onboarding-identity-next"));
    await waitFor(() => expect(screen.getByTestId("gb-onboarding-activities")).toBeTruthy());
  });

  it("supports multi-select activities", async () => {
    render(<GrossisteBQuickOnboarding onComplete={vi.fn()} />);
    fireEvent.change(screen.getByTestId("gb-onboarding-phone-input"), {
      target: { value: "+2250700000000" },
    });
    fireEvent.click(screen.getByTestId("gb-onboarding-otp-auto"));
    fireEvent.click(screen.getByTestId("gb-onboarding-phone-next"));
    await waitFor(() => screen.getByTestId("gb-onboarding-display-name"));
    fireEvent.change(screen.getByTestId("gb-onboarding-display-name"), { target: { value: "Sarah grossiste" } });
    fireEvent.click(screen.getByTestId("gb-onboarding-identity-next"));
    await waitFor(() => screen.getByTestId("gb-onboarding-activity-boissons"));
    fireEvent.click(screen.getByTestId("gb-onboarding-activity-boissons"));
    fireEvent.click(screen.getByTestId("gb-onboarding-activity-sucre"));
    expect(screen.getByTestId("gb-onboarding-activity-boissons").getAttribute("data-selected")).toBe("true");
    expect(screen.getByTestId("gb-onboarding-activity-sucre").getAttribute("data-selected")).toBe("true");
  });

  it("selects city via search list", async () => {
    render(<GrossisteBQuickOnboarding onComplete={vi.fn()} />);
    fireEvent.change(screen.getByTestId("gb-onboarding-phone-input"), {
      target: { value: "+2250700000000" },
    });
    fireEvent.click(screen.getByTestId("gb-onboarding-otp-auto"));
    fireEvent.click(screen.getByTestId("gb-onboarding-phone-next"));
    await waitFor(() => screen.getByTestId("gb-onboarding-display-name"));
    fireEvent.change(screen.getByTestId("gb-onboarding-display-name"), { target: { value: "Moussa" } });
    fireEvent.click(screen.getByTestId("gb-onboarding-identity-next"));
    await waitFor(() => screen.getByTestId("gb-onboarding-activity-alimentation"));
    fireEvent.click(screen.getByTestId("gb-onboarding-activity-alimentation"));
    fireEvent.click(screen.getByTestId("gb-onboarding-activities-next"));
    await waitFor(() => screen.getByTestId("gb-onboarding-city-search"));
    fireEvent.change(screen.getByTestId("gb-onboarding-city-search"), { target: { value: "Yop" } });
    expect(screen.queryByTestId("gb-onboarding-city-abidjan")).toBeNull();
  });

  it("completes fast onboarding without logo upload", async () => {
    const onComplete = vi.fn();
    render(<GrossisteBQuickOnboarding onComplete={onComplete} />);
    await completeGrossisteBOnboarding();
    await waitFor(() => expect(onComplete).toHaveBeenCalled());
    expect(isGrossisteBOnboardingComplete()).toBe(true);
    expect(screen.queryByTestId("gb-onboarding-logo")).toBeNull();
  });

  it("does not require profile photo", async () => {
    render(<GrossisteBQuickOnboarding onComplete={vi.fn()} />);
    await waitFor(() => screen.getByTestId("gb-onboarding-phone"));
    expect(screen.queryByTestId("gb-onboarding-photo")).toBeNull();
  });
});
