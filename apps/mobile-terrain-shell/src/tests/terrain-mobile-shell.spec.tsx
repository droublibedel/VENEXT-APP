/** @vitest-environment jsdom */
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  TERRAIN_PROFILE_STORAGE_KEY,
  applyBackendTerrainProfileState,
  switchTerrainProfileAsync,
} from "commerce-terrain-profile-runtime";

import { TerrainMobileShell } from "../TerrainMobileShell";

const PLACEHOLDER_PATTERN = /bientôt disponible|coming soon/i;

vi.mock("@venext/mobile-detaillant/app-shell/DetaillantAppShell", () => ({
  DetaillantAppShell: () => <div data-testid="detaillant-profile-host">detaillant-host</div>,
}));
vi.mock("@venext/mobile-grossiste-b/app-shell/GrossisteBAppShell", () => ({
  GrossisteBAppShell: () => <div data-testid="grossiste-profile-host">grossiste-host</div>,
}));
vi.mock("@venext/mobile-detaillant/auth/DetaillantAuthProvider", () => ({
  DetaillantAuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));
vi.mock("@venext/mobile-grossiste-b/auth/GrossisteBAuthProvider", () => ({
  GrossisteBAuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));
vi.mock("@venext/mobile-detaillant/i18n/DetaillantVenextLocale", () => ({
  DetaillantVenextLocale: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));
vi.mock("@venext/mobile-grossiste-b/i18n/GrossisteVenextLocale", () => ({
  GrossisteVenextLocale: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));
vi.mock("@venext/mobile-detaillant/onboarding/detaillant-onboarding.viewmodel", () => ({
  loadDetaillantOnboardingProfile: () => ({ phone: "0700000001", organizationId: "org-dt" }),
  isDetaillantOnboardingComplete: () => true,
  saveDetaillantOnboardingProfile: vi.fn(),
}));
vi.mock("@venext/mobile-grossiste-b/onboarding/grossiste-b-onboarding.viewmodel", () => ({
  loadGrossisteBOnboardingProfile: () => null,
  isGrossisteBOnboardingComplete: () => true,
  saveGrossisteBOnboardingProfile: vi.fn(),
}));
vi.mock("@venext/mobile-detaillant/hooks/useDetaillantLiveData", () => ({
  clearDetaillantDataCache: vi.fn(),
}));
vi.mock("@venext/mobile-grossiste-b/hooks/useGrossisteLiveData", () => ({
  clearGrossisteDataCache: vi.fn(),
}));

type IdentityState = {
  userKey: string;
  currentActiveProfile: "detaillant" | "grossiste_b";
  primaryProfile: "detaillant" | "grossiste_b";
  enabledProfiles: ("detaillant" | "grossiste_b")[];
  activeProfileVersion: number;
};

function createFetchHandler(stateRef: { current: IdentityState | null }) {
  return (url: string, init?: RequestInit) => {
    const href = String(url);
    if (href.includes("/api/terrain/profile-identity?")) {
      return Promise.resolve(
        new Response(
          JSON.stringify({ ok: true, identity: stateRef.current, source: "backend" }),
          { status: 200 },
        ),
      );
    }
    if (href.includes("/api/terrain/profile-identity/switch") && init?.method === "POST") {
      const body = JSON.parse(String(init.body)) as { targetProfile: string };
      const current = stateRef.current;
      const target = body.targetProfile === "GROSSISTE_B" ? "grossiste_b" : "detaillant";
      stateRef.current = {
        userKey: current?.userKey ?? "0000000001",
        currentActiveProfile: target,
        primaryProfile: current?.primaryProfile ?? target,
        enabledProfiles: Array.from(new Set([...(current?.enabledProfiles ?? []), target])),
        activeProfileVersion: (current?.activeProfileVersion ?? 0) + 1,
      };
      return Promise.resolve(
        new Response(
          JSON.stringify({ ok: true, identity: stateRef.current, conflictResolved: false }),
          { status: 200 },
        ),
      );
    }
    if (href.includes("/api/terrain/profile-identity/current-profile") && init?.method === "PUT") {
      const body = JSON.parse(String(init.body)) as { currentActiveProfile: string; userKey: string };
      const target = body.currentActiveProfile === "GROSSISTE_B" ? "grossiste_b" : "detaillant";
      stateRef.current = {
        userKey: body.userKey,
        currentActiveProfile: target,
        primaryProfile: target,
        enabledProfiles: [target],
        activeProfileVersion: 1,
      };
      return Promise.resolve(new Response(JSON.stringify({ ok: true, identity: stateRef.current }), { status: 200 }));
    }
    return Promise.resolve(new Response(JSON.stringify({ ok: true, flags: {} }), { status: 200 }));
  };
}

function seedIdentity(identity: IdentityState) {
  applyBackendTerrainProfileState(
    {
      userKey: identity.userKey,
      primaryProfile: identity.primaryProfile,
      currentActiveProfile: identity.currentActiveProfile,
      enabledProfiles: identity.enabledProfiles,
      activeProfileVersion: identity.activeProfileVersion,
    },
    identity.userKey,
  );
}

afterEach(() => {
  cleanup();
  localStorage.removeItem(TERRAIN_PROFILE_STORAGE_KEY);
});

describe("TerrainMobileShell profile switch", () => {
  const stateRef: { current: IdentityState | null } = { current: null };

  beforeEach(() => {
    stateRef.current = {
      userKey: "0000000001",
      currentActiveProfile: "detaillant",
      primaryProfile: "detaillant",
      enabledProfiles: ["detaillant"],
      activeProfileVersion: 1,
    };
    seedIdentity(stateRef.current);
    vi.stubGlobal("fetch", vi.fn(createFetchHandler(stateRef)));
  });

  it("boots detaillant host from backend identity on refresh", async () => {
    render(<TerrainMobileShell />);
    await waitFor(() => expect(screen.getByTestId("detaillant-profile-host")).toBeTruthy());
    expect(screen.getByTestId("terrain-mobile-shell").getAttribute("data-active-profile")).toBe("detaillant");
    expect(screen.queryByText(PLACEHOLDER_PATTERN)).toBeNull();
  });

  it("switches detaillant → grossiste and mounts GrossisteBProfileHost", async () => {
    render(<TerrainMobileShell />);
    await waitFor(() => screen.getByTestId("detaillant-profile-host"));
  const remountBefore = screen.getByTestId("terrain-mobile-shell").getAttribute("data-profile-remount");

    await switchTerrainProfileAsync("grossiste_b");

    await waitFor(() => expect(screen.getByTestId("grossiste-profile-host")).toBeTruthy());
    expect(screen.queryByTestId("detaillant-profile-host")).toBeNull();
    expect(screen.getByTestId("terrain-mobile-shell").getAttribute("data-active-profile")).toBe("grossiste_b");
    expect(stateRef.current?.currentActiveProfile).toBe("grossiste_b");
    const remountAfter = screen.getByTestId("terrain-mobile-shell").getAttribute("data-profile-remount");
    expect(Number(remountAfter)).toBeGreaterThan(Number(remountBefore));
    expect(screen.queryByText(PLACEHOLDER_PATTERN)).toBeNull();
  });

  it("switches grossiste → détaillant and remounts DetaillantProfileHost", async () => {
    stateRef.current = {
      userKey: "0000000001",
      currentActiveProfile: "grossiste_b",
      primaryProfile: "detaillant",
      enabledProfiles: ["detaillant", "grossiste_b"],
      activeProfileVersion: 2,
    };
    seedIdentity(stateRef.current);

    render(<TerrainMobileShell />);
    await waitFor(() => screen.getByTestId("grossiste-profile-host"));

    await switchTerrainProfileAsync("detaillant");

    await waitFor(() => expect(screen.getByTestId("detaillant-profile-host")).toBeTruthy());
    expect(screen.queryByTestId("grossiste-profile-host")).toBeNull();
    expect(screen.getByTestId("terrain-mobile-shell").getAttribute("data-active-profile")).toBe("detaillant");
    expect(screen.queryByText(PLACEHOLDER_PATTERN)).toBeNull();
  });

  it("shows profile gate when no primary profile", async () => {
    stateRef.current = null;
    localStorage.removeItem(TERRAIN_PROFILE_STORAGE_KEY);
    render(<TerrainMobileShell />);
    await waitFor(() => expect(screen.getByTestId("terrain-profile-selection")).toBeTruthy());
  });

  it("loads detaillant host after onboarding profile choice", async () => {
    stateRef.current = null;
    localStorage.removeItem(TERRAIN_PROFILE_STORAGE_KEY);
    render(<TerrainMobileShell />);
    await waitFor(() => screen.getByTestId("terrain-profile-option-detaillant"));
    fireEvent.click(screen.getByTestId("terrain-profile-option-detaillant"));
    fireEvent.click(screen.getByTestId("terrain-profile-continue"));
    await waitFor(() => expect(screen.getByTestId("detaillant-profile-host")).toBeTruthy());
  });
});
