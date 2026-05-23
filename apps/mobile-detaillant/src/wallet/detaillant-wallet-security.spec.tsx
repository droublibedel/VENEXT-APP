/** @vitest-environment jsdom */
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { clearWalletSecurityPersistence, syncWalletBalanceFcfa } from "venext-auth-foundation";

import { DetaillantAuthProvider } from "../auth/DetaillantAuthProvider";
import { DetaillantWalletScreen } from "./DetaillantWalletScreen";

const mockWalletBalance = vi.hoisted(() => vi.fn(() => ({ data: { availableLabel: "0 FCFA" }, refresh: vi.fn() })));

vi.mock("commerce-wallet", async (importOriginal) => {
  const actual = await importOriginal<typeof import("commerce-wallet")>();
  return {
    ...actual,
    useCommerceWalletBalance: () => mockWalletBalance(),
    useCommerceTransactions: () => ({ data: [], refresh: vi.fn() }),
    clearCommerceWalletCache: vi.fn(),
  };
});

vi.mock("../hooks/useDetaillantFeatureFlags", () => ({
  useDetaillantFeatureFlags: () => ({
    flags: {
      detaillant_mobile_enabled: true,
      detaillant_wallet_enabled: true,
      venext_auth_foundation_enabled: true,
      venext_session_restore_enabled: true,
      venext_profile_foundation_enabled: true,
      terrain_unlimited_session_enabled: true,
      wallet_adaptive_security_enabled: true,
      wallet_bceao_kyc_enabled: true,
      wallet_biometric_unlock_enabled: true,
    },
    hydrated: true,
  }),
}));

describe("detaillant wallet security (20.78-A)", () => {
  afterEach(() => cleanup());

  beforeEach(() => {
    clearWalletSecurityPersistence();
    localStorage.clear();
    mockWalletBalance.mockReturnValue({ data: { availableLabel: "0 FCFA" }, refresh: vi.fn() });
    vi.stubGlobal("fetch", vi.fn(() => Promise.reject(new Error("offline"))));
  });

  it("renders wallet shell in light mode", async () => {
    syncWalletBalanceFcfa(0);
    render(
      <DetaillantAuthProvider walletBalanceFcfa={0}>
        <DetaillantWalletScreen enabled />
      </DetaillantAuthProvider>,
    );
    await waitFor(() => expect(screen.getByTestId("detaillant-commerce-wallet")).toBeTruthy());
    expect(screen.queryByTestId("detaillant-wallet-bceao-activation")).toBeNull();
  });

  it("prompts BCEAO activation when balance is secured without PIN", async () => {
    mockWalletBalance.mockReturnValue({ data: { availableLabel: "2 000 FCFA" }, refresh: vi.fn() });
    syncWalletBalanceFcfa(2000);
    render(
      <DetaillantAuthProvider walletBalanceFcfa={2000}>
        <DetaillantWalletScreen enabled />
      </DetaillantAuthProvider>,
    );
    await waitFor(() => expect(screen.getByTestId("detaillant-wallet-bceao-activation")).toBeTruthy());
  });
});
