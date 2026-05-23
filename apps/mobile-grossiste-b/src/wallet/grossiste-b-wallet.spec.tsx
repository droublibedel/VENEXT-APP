/** @vitest-environment jsdom */
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { clearCommerceWalletCache } from "commerce-wallet";

import { GrossisteBAppShell } from "../app-shell/GrossisteBAppShell";
import { GROSSISTE_B_TABS } from "../navigation/grossiste-b-navigation.config";
import { GrossisteBWalletScreen } from "./GrossisteBWalletScreen";
import { buildGrossisteSettlementHints } from "./grossiste-b-wallet-intelligence";
import { grossisteBWalletAccountSettings } from "./grossiste-b-wallet-governance";
import {
  mockCommerceTransactions,
  mockCommerceWalletBalance,
  mockCommercePaymentActivity,
  sanitizeWalletText,
} from "commerce-wallet";

vi.mock("../hooks/useGrossisteFeatureFlags", () => ({
  useGrossisteFeatureFlags: () => ({
    flags: {
      grossiste_b_mobile_enabled: true,
      grossiste_b_wallet_enabled: true,
      commerce_hybrid_settlement_enabled: true,
      terrain_quick_onboarding_enabled: false,
    },
    hydrated: true,
  }),
}));

describe("grossiste B wallet (20.65)", () => {
  afterEach(() => cleanup());

  beforeEach(() => {
    clearCommerceWalletCache();
    vi.stubGlobal("fetch", vi.fn(() => Promise.reject(new Error("offline"))));
  });

  it("exposes Règlements tab after Messagerie", () => {
    const keys = GROSSISTE_B_TABS.map((t) => t.key);
    expect(keys.indexOf("messaging")).toBeLessThan(keys.indexOf("wallet"));
    expect(GROSSISTE_B_TABS.find((t) => t.id === "wallet")?.label).toBe("Règlements");
  });

  it("navigates to wallet screen from shell", async () => {
    render(<GrossisteBAppShell />);
    fireEvent.click(screen.getByTestId("grossiste-tab-wallet"));
    await waitFor(() => expect(screen.getByTestId("grossiste-screen-wallet")).toBeTruthy());
    expect(screen.getByTestId("grossiste-b-commerce-wallet")).toBeTruthy();
  });

  it("renders mobile wallet shell", async () => {
    render(<GrossisteBWalletScreen enabled />);
    await waitFor(() => expect(screen.getByTestId("grossiste-b-commerce-wallet")).toBeTruthy());
  });

  it("uses mobile layout", async () => {
    render(<GrossisteBWalletScreen enabled />);
    await waitFor(() => {
      expect(screen.getByTestId("grossiste-b-commerce-wallet").getAttribute("data-layout")).toBe(
        "mobile",
      );
    });
  });

  it("supports cash and mobile money", () => {
    const txs = mockCommerceTransactions().payload;
    expect(txs.some((t) => t.settlementMethod === "cash")).toBe(true);
    expect(txs.some((t) => t.settlementMethod === "mobile-money")).toBe(true);
  });

  it("grossiste B governance defaults to mobile money mode", () => {
    const account = grossisteBWalletAccountSettings({ commerce_hybrid_settlement_enabled: true });
    expect(account.defaultMode).toBe("MOBILE_MONEY_SETTLEMENT");
  });

  it("builds terrain settlement hints", () => {
    const hints = buildGrossisteSettlementHints({
      balance: mockCommerceWalletBalance().payload,
      transactions: mockCommerceTransactions().payload,
      activity: mockCommercePaymentActivity().payload,
    });
    expect(hints.length).toBeGreaterThan(0);
  });

  it("anti-jargon", () => {
    expect(sanitizeWalletText("bank fintech assistant")).not.toMatch(/fintech|assistant/i);
  });

  it("catalog tab works without wallet", async () => {
    render(<GrossisteBAppShell />);
    fireEvent.click(screen.getByTestId("grossiste-tab-catalog"));
    await waitFor(() => expect(screen.getByTestId("grossiste-main-catalog")).toBeTruthy());
  });

  it("large touch refresh button", async () => {
    render(<GrossisteBWalletScreen enabled />);
    await waitFor(() => expect(screen.getByTestId("grossiste-wallet-refresh")).toBeTruthy());
  });

  it("lazy loads wallet screen in shell", async () => {
    render(<GrossisteBAppShell />);
    expect(screen.queryByTestId("grossiste-screen-wallet")).toBeNull();
    fireEvent.click(screen.getByTestId("grossiste-tab-wallet"));
    await waitFor(() => expect(screen.getByTestId("grossiste-screen-wallet")).toBeTruthy());
  });
});
