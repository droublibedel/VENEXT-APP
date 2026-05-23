/** @vitest-environment jsdom */
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { clearCommerceWalletCache } from "commerce-wallet";

import { DetaillantAppShell } from "../app-shell/DetaillantAppShell";
import { DetaillantAccountScreen } from "../screens/DetaillantAccountScreen";
import { DetaillantProductsScreen } from "../screens/DetaillantProductsScreen";
import { DetaillantWalletScreen } from "./DetaillantWalletScreen";
import { buildRetailSettlementHints } from "./detaillant-wallet-intelligence";
import { detaillantWalletAccountSettings } from "./detaillant-wallet-governance";
import { mockCommerceTransactions, sanitizeWalletText } from "commerce-wallet";

vi.mock("../hooks/useDetaillantFeatureFlags", () => ({
  useDetaillantFeatureFlags: () => ({
    flags: {
      detaillant_mobile_enabled: true,
      detaillant_wallet_enabled: true,
      relational_catalog_enabled: false,
      terrain_quick_onboarding_enabled: false,
    },
    hydrated: true,
  }),
}));

vi.mock("../hooks/useDetaillantProductsData", () => ({
  useDetaillantProductsData: () => ({
    data: {
      products: [
        {
          id: "p1",
          name: "Riz 25kg",
          category: "Alimentaire",
          city: "Abidjan",
          priceLabel: "12 500 FCFA",
          pricingMode: "FIXED_PRICE",
        },
      ],
      popularIds: [],
    },
    loading: false,
    dataSource: "fallback",
    fallbackUsed: true,
    refresh: vi.fn(),
  }),
}));

describe("detaillant wallet (20.65)", () => {
  afterEach(() => cleanup());

  beforeEach(() => {
    clearCommerceWalletCache();
    vi.stubGlobal("fetch", vi.fn(() => Promise.reject(new Error("offline"))));
  });

  it("wallet is optional in account — toggle reveals screen", async () => {
    render(<DetaillantAccountScreen enabled />);
    expect(screen.getByTestId("detaillant-account-wallet-toggle")).toBeTruthy();
    fireEvent.click(screen.getByTestId("detaillant-account-wallet-toggle"));
    await waitFor(() => expect(screen.getByTestId("detaillant-wallet-section")).toBeTruthy());
  });

  it("renders ultra-simple retail wallet", async () => {
    render(<DetaillantWalletScreen enabled />);
    await waitFor(() => expect(screen.getByTestId("detaillant-commerce-wallet")).toBeTruthy());
    expect(screen.getByTestId("detaillant-wallet-optional")).toBeTruthy();
  });

  it("quick order works without opening wallet", async () => {
    render(<DetaillantProductsScreen enabled />);
    fireEvent.click(screen.getByTestId("detaillant-quick-order-p1"));
    await waitFor(() => expect(screen.getByTestId("detaillant-checkout")).toBeTruthy());
    expect(screen.queryByTestId("detaillant-commerce-wallet")).toBeNull();
  });

  it("retail governance prefers cash", () => {
    const account = detaillantWalletAccountSettings();
    expect(account.defaultMode).toBe("CASH_SETTLEMENT");
    expect(account.hybridSettlementEnabled).toBe(false);
  });

  it("builds retail settlement hints", () => {
    const txs = mockCommerceTransactions().payload.filter((t) => t.actorRole === "detaillant");
    const hints = buildRetailSettlementHints(txs.length ? txs : mockCommerceTransactions().payload);
    expect(hints.length).toBeGreaterThan(0);
  });

  it("anti-jargon", () => {
    expect(sanitizeWalletText("scoring fintech")).not.toMatch(/scoring|fintech/i);
  });

  it("mobile layout shell", async () => {
    render(<DetaillantWalletScreen enabled />);
    await waitFor(() => {
      expect(screen.getByTestId("detaillant-commerce-wallet").getAttribute("data-layout")).toBe(
        "mobile",
      );
    });
  });

  it("products tab still primary without wallet tab", () => {
    render(<DetaillantAppShell />);
    fireEvent.click(screen.getByTestId("detaillant-tab-products"));
    expect(screen.getByTestId("detaillant-main-products")).toBeTruthy();
  });

  it("lazy loads wallet only when toggled", async () => {
    render(<DetaillantAccountScreen enabled />);
    expect(screen.queryByTestId("detaillant-commerce-wallet")).toBeNull();
    fireEvent.click(screen.getByTestId("detaillant-account-wallet-toggle"));
    await waitFor(() => expect(screen.getByTestId("detaillant-commerce-wallet")).toBeTruthy());
  });

  it("manual refresh", async () => {
    render(<DetaillantWalletScreen enabled />);
    await waitFor(() => expect(screen.getByTestId("detaillant-wallet-refresh")).toBeTruthy());
    fireEvent.click(screen.getByTestId("detaillant-wallet-refresh"));
  });

  it("supports cash settlement display", () => {
    const txs = mockCommerceTransactions().payload;
    expect(txs.some((t) => t.settlementMethod === "cash")).toBe(true);
  });
});
