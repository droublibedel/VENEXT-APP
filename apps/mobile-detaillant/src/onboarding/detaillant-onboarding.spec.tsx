/** @vitest-environment jsdom */
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { TERRAIN_PROFILE_STORAGE_KEY } from "commerce-terrain-profile-runtime";
import { DetaillantQuickOnboarding } from "./DetaillantQuickOnboarding";
import { DETAILLANT_ONBOARDING_STORAGE_KEY } from "./detaillant-onboarding.types";
import {
  createEmptyDetaillantProfile,
  isDetaillantOnboardingComplete,
  loadDetaillantOnboardingProfile,
  MOCK_OTP_CODE,
  saveDetaillantOnboardingProfile,
  clearDetaillantOnboardingProfile,
  validateDetaillantOtp,
  validateDetaillantPhone,
} from "./detaillant-onboarding.viewmodel";

async function goPastTerrainProfileStep() {
  if (!screen.queryByTestId("terrain-profile-selection")) return;
  fireEvent.click(screen.getByTestId("terrain-profile-option-detaillant"));
  fireEvent.click(screen.getByTestId("terrain-profile-continue"));
  await waitFor(() => expect(screen.getByTestId("dt-onboarding-phone")).toBeTruthy());
}

async function completeDetaillantOnboarding() {
  await goPastTerrainProfileStep();
  fireEvent.change(screen.getByTestId("dt-onboarding-phone-input"), {
    target: { value: "0700000002" },
  });
  fireEvent.click(screen.getByTestId("dt-onboarding-otp-auto"));
  fireEvent.click(screen.getByTestId("dt-onboarding-phone-next"));
  await waitFor(() => expect(screen.getByTestId("dt-onboarding-identity")).toBeTruthy());
  fireEvent.change(screen.getByTestId("dt-onboarding-display-name"), { target: { value: "François" } });
  fireEvent.click(screen.getByTestId("dt-onboarding-identity-next"));
  await waitFor(() => expect(screen.getByTestId("dt-onboarding-activities")).toBeTruthy());
  fireEvent.click(screen.getByTestId("dt-onboarding-activity-boissons"));
  fireEvent.click(screen.getByTestId("dt-onboarding-activities-next"));
  await waitFor(() => expect(screen.getByTestId("dt-onboarding-city")).toBeTruthy());
  fireEvent.click(screen.getByTestId("dt-onboarding-city-bouaké"));
  fireEvent.click(screen.getByTestId("dt-onboarding-finish"));
}

afterEach(() => {
  cleanup();
  localStorage.removeItem(DETAILLANT_ONBOARDING_STORAGE_KEY);
  localStorage.removeItem(TERRAIN_PROFILE_STORAGE_KEY);
});

describe("detaillant onboarding viewmodel", () => {
  it("validates phone", () => {
    expect(validateDetaillantPhone("07")).toBe(false);
    expect(validateDetaillantPhone("0701020304")).toBe(true);
  });

  it("validates OTP mock", () => {
    expect(validateDetaillantOtp(MOCK_OTP_CODE)).toBe(true);
  });

  it("saves and loads profile", () => {
    saveDetaillantOnboardingProfile({
      ...createEmptyDetaillantProfile(),
      phone: "0700000007",
      otpVerified: true,
      displayName: "Aminata",
      activities: ["Boissons"],
      city: "Abidjan",
    });
    expect(loadDetaillantOnboardingProfile()?.displayName).toBe("Aminata");
  });

  it("clears profile on logout", () => {
    saveDetaillantOnboardingProfile({
      ...createEmptyDetaillantProfile(),
      phone: "0700000007",
      otpVerified: true,
      displayName: "Aminata",
      activities: ["Boissons"],
      city: "Abidjan",
    });
    clearDetaillantOnboardingProfile();
    expect(loadDetaillantOnboardingProfile()).toBeNull();
    expect(isDetaillantOnboardingComplete()).toBe(false);
  });
});

describe("detaillant quick onboarding flow", () => {
  beforeEach(() => {
    localStorage.removeItem(DETAILLANT_ONBOARDING_STORAGE_KEY);
    localStorage.removeItem(TERRAIN_PROFILE_STORAGE_KEY);
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo) => {
        const url = String(input);
        if (url.includes("/api/detaillant/onboarding/complete")) {
          return new Response(
            JSON.stringify({
              ok: true,
              organizationId: "org-detaillant-7000000002",
              profile: { displayName: "François" },
            }),
            { status: 200, headers: { "Content-Type": "application/json" } },
          );
        }
        return new Response(JSON.stringify({ ok: false }), { status: 404 });
      }),
    );
  });

  it("starts with profile selection when no primary profile", async () => {
    render(<DetaillantQuickOnboarding onComplete={vi.fn()} />);
    await waitFor(() => expect(screen.getByTestId("terrain-profile-selection")).toBeTruthy());
  });

  it("uses premium onboarding copy without internal vocabulary", async () => {
    render(<DetaillantQuickOnboarding onComplete={vi.fn()} />);
    await waitFor(() => expect(screen.getByTestId("dt-onboarding-progress")).toBeTruthy());
    expect(screen.getByTestId("dt-onboarding-progress").textContent).toMatch(/Commençons/);
    expect(screen.queryByText(/terrain rapide|profil principal|pas de fiche/i)).toBeNull();
  });

  it("OTP auto simulation", async () => {
    render(<DetaillantQuickOnboarding onComplete={vi.fn()} />);
    await goPastTerrainProfileStep();
    fireEvent.change(screen.getByTestId("dt-onboarding-phone-input"), {
      target: { value: "0700000000" },
    });
    fireEvent.click(screen.getByTestId("dt-onboarding-otp-auto"));
    fireEvent.click(screen.getByTestId("dt-onboarding-phone-next"));
    await waitFor(() => expect(screen.getByTestId("dt-onboarding-identity")).toBeTruthy());
  });

  it("single identity field only", async () => {
    render(<DetaillantQuickOnboarding onComplete={vi.fn()} />);
    await goPastTerrainProfileStep();
    fireEvent.change(screen.getByTestId("dt-onboarding-phone-input"), {
      target: { value: "0700000000" },
    });
    fireEvent.click(screen.getByTestId("dt-onboarding-otp-auto"));
    fireEvent.click(screen.getByTestId("dt-onboarding-phone-next"));
    await waitFor(() => screen.getByTestId("dt-onboarding-display-name"));
    expect(screen.queryByTestId("dt-onboarding-business-name")).toBeNull();
  });

  it("pseudo Sarah grossiste", async () => {
    render(<DetaillantQuickOnboarding onComplete={vi.fn()} />);
    await goPastTerrainProfileStep();
    fireEvent.change(screen.getByTestId("dt-onboarding-phone-input"), {
      target: { value: "0700000000" },
    });
    fireEvent.click(screen.getByTestId("dt-onboarding-otp-auto"));
    fireEvent.click(screen.getByTestId("dt-onboarding-phone-next"));
    await waitFor(() => screen.getByTestId("dt-onboarding-display-name"));
    fireEvent.change(screen.getByTestId("dt-onboarding-display-name"), {
      target: { value: "Sarah grossiste" },
    });
    expect(screen.getByTestId("dt-onboarding-identity-next")).toHaveProperty("disabled", false);
  });

  it("multi activities", async () => {
    render(<DetaillantQuickOnboarding onComplete={vi.fn()} />);
    await goPastTerrainProfileStep();
    fireEvent.change(screen.getByTestId("dt-onboarding-phone-input"), {
      target: { value: "0700000000" },
    });
    fireEvent.click(screen.getByTestId("dt-onboarding-otp-auto"));
    fireEvent.click(screen.getByTestId("dt-onboarding-phone-next"));
    await waitFor(() => screen.getByTestId("dt-onboarding-display-name"));
    fireEvent.change(screen.getByTestId("dt-onboarding-display-name"), { target: { value: "Aminata" } });
    fireEvent.click(screen.getByTestId("dt-onboarding-identity-next"));
    await waitFor(() => screen.getByTestId("dt-onboarding-activity-boissons"));
    fireEvent.click(screen.getByTestId("dt-onboarding-activity-boissons"));
    fireEvent.click(screen.getByTestId("dt-onboarding-activity-beauté"));
    fireEvent.click(screen.getByTestId("dt-onboarding-activities-next"));
    await waitFor(() => expect(screen.getByTestId("dt-onboarding-city")).toBeTruthy());
  });

  it("city selection", async () => {
    render(<DetaillantQuickOnboarding onComplete={vi.fn()} />);
    await goPastTerrainProfileStep();
    fireEvent.change(screen.getByTestId("dt-onboarding-phone-input"), {
      target: { value: "0700000000" },
    });
    fireEvent.click(screen.getByTestId("dt-onboarding-otp-auto"));
    fireEvent.click(screen.getByTestId("dt-onboarding-phone-next"));
    await waitFor(() => screen.getByTestId("dt-onboarding-display-name"));
    fireEvent.change(screen.getByTestId("dt-onboarding-display-name"), { target: { value: "François" } });
    fireEvent.click(screen.getByTestId("dt-onboarding-identity-next"));
    await waitFor(() => screen.getByTestId("dt-onboarding-activity-alimentation"));
    fireEvent.click(screen.getByTestId("dt-onboarding-activity-alimentation"));
    fireEvent.click(screen.getByTestId("dt-onboarding-activities-next"));
    fireEvent.click(screen.getByTestId("dt-onboarding-city-abidjan"));
    expect(screen.getByTestId("dt-onboarding-finish")).toHaveProperty("disabled", false);
  });

  it("no logo or boutique required", async () => {
    render(<DetaillantQuickOnboarding onComplete={vi.fn()} />);
    await goPastTerrainProfileStep();
    expect(screen.queryByTestId("dt-onboarding-logo")).toBeNull();
    expect(screen.queryByTestId("dt-onboarding-business-name")).toBeNull();
  });

  it("completes onboarding quickly", async () => {
    const onComplete = vi.fn();
    render(<DetaillantQuickOnboarding onComplete={onComplete} />);
    await completeDetaillantOnboarding();
    await waitFor(() => expect(onComplete).toHaveBeenCalled());
    expect(isDetaillantOnboardingComplete()).toBe(true);
    expect(loadDetaillantOnboardingProfile()?.organizationId).toBe("org-detaillant-7000000002");
  });
});
