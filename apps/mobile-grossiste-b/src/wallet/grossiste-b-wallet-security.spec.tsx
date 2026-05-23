/** @vitest-environment jsdom */
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { clearWalletSecurityPersistence, syncWalletBalanceFcfa } from "venext-auth-foundation";

import { GrossisteBAuthProvider } from "../auth/GrossisteBAuthProvider";
import { GrossisteBWalletScreen } from "./GrossisteBWalletScreen";

const mockWalletBalance = vi.hoisted(() => vi.fn(() => ({ data: { availableLabel: "0 FCFA" }, refresh: vi.fn() })));

vi.mock("commerce-wallet", async (importOriginal) => {
  const actual = await importOriginal<typeof import("commerce-wallet")>();
  return {
    ...actual,
    useCommerceWalletBalance: () => mockWalletBalance(),
    useCommerceTransactions: () => ({ data: [], refresh: vi.fn() }),
    useCommercePaymentActivity: () => ({ data: [], refresh: vi.fn() }),
    clearCommerceWalletCache: vi.fn(),
  };
});

vi.mock("../hooks/useGrossisteFeatureFlags", () => ({
  useGrossisteFeatureFlags: () => ({
    flags: {
      grossiste_b_mobile_enabled: true,
      grossiste_b_wallet_enabled: true,
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

describe("grossiste B wallet security (20.78-A)", () => {
  afterEach(() => cleanup());

  beforeEach(() => {
    clearWalletSecurityPersistence();
    localStorage.clear();
    mockWalletBalance.mockReturnValue({ data: { availableLabel: "0 FCFA" }, refresh: vi.fn() });
    vi.stubGlobal("fetch", vi.fn(() => Promise.reject(new Error("offline"))));
  });

  it("shows commerce wallet in light mode when balance is zero", async () => {
    syncWalletBalanceFcfa(0);
    render(
      <GrossisteBAuthProvider walletBalanceFcfa={0}>
        <GrossisteBWalletScreen enabled />
      </GrossisteBAuthProvider>,
    );
    await waitFor(() => expect(screen.getByTestId("grossiste-b-commerce-wallet")).toBeTruthy());
    expect(screen.queryByTestId("wallet-bceao-activation")).toBeNull();
    expect(screen.queryByTestId("grossiste-wallet-lock-gate")).toBeNull();
  });

  it("shows BCEAO activation when mock balance exceeds threshold without PIN", async () => {
    mockWalletBalance.mockReturnValue({ data: { availableLabel: "1 500 FCFA" }, refresh: vi.fn() });
    syncWalletBalanceFcfa(1500);
    render(
      <GrossisteBAuthProvider walletBalanceFcfa={1500}>
        <GrossisteBWalletScreen enabled />
      </GrossisteBAuthProvider>,
    );
    await waitFor(() => expect(screen.getByTestId("wallet-bceao-activation")).toBeTruthy());
    expect(screen.queryByTestId("grossiste-b-commerce-wallet")).toBeNull();
  });
});
