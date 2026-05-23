/** @vitest-environment jsdom */
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { clearCommerceWalletCache } from "commerce-wallet";

import { ProducerFinanceCollectionsWorkspace } from "../finance-collections-workspace/ProducerFinanceCollectionsWorkspace";
import { ProducerWalletWorkspace } from "./ProducerWalletWorkspace";
import { buildProducerSettlementHints } from "./producer-wallet-intelligence";
import { producerWalletAccountSettings } from "./producer-wallet-governance";
import {
  mockCommercePartnerPayments,
  mockCommerceTransactions,
  mockCommerceWalletBalance,
  mockCommercePaymentActivity,
  sanitizeWalletText,
} from "commerce-wallet";

vi.mock("@/poles/hooks/useIndustrialFeatureFlags", () => ({
  useIndustrialFeatureFlags: () => ({
    flags: {
      producer_industrial_web_enabled: true,
      producer_finance_collections_workspace_enabled: true,
      producer_wallet_enabled: true,
      commerce_hybrid_settlement_enabled: true,
      commerce_manual_confirmation_enabled: true,
    },
    hydrated: true,
  }),
}));

vi.mock("../finance-collections-workspace/useProducerFinanceWorkspaceData", () => ({
  useProducerFinanceWorkspaceData: () => ({
    view: {
      overview: [],
      collections: [],
      stability: [],
      risks: [],
      revenue: [],
      coverage: [],
      insights: [],
    },
    loading: false,
    error: null,
    dataSource: "fallback",
    fallbackUsed: true,
    refresh: vi.fn(),
  }),
}));

describe("producer wallet integration (20.65)", () => {
  afterEach(() => cleanup());

  beforeEach(() => {
    clearCommerceWalletCache();
    vi.stubGlobal("fetch", vi.fn(() => Promise.reject(new Error("offline"))));
  });

  it("renders producer wallet workspace", async () => {
    render(<ProducerWalletWorkspace />);
    await waitFor(() => expect(screen.getByTestId("producer-wallet-workspace")).toBeTruthy());
    expect(screen.getByText(/Règlements partenaires/i)).toBeTruthy();
  });

  it("avoids bank jargon in headers", async () => {
    render(<ProducerWalletWorkspace />);
    await waitFor(() => expect(screen.getByTestId("producer-wallet-workspace")).toBeTruthy());
    const text = document.body.textContent ?? "";
    expect(text).not.toMatch(/solde bancaire|wallet financier|banque numérique/i);
    expect(text).toMatch(/règlement|partenaire|commercial/i);
  });

  it("shows bank transfer panel tab", async () => {
    render(<ProducerWalletWorkspace />);
    fireEvent.click(screen.getByTestId("producer-wallet-tab-transfers"));
    await waitFor(() =>
      expect(
        screen.getByTestId("producer-bank-transfer-panel") ||
          screen.getByTestId("producer-bank-transfer-empty"),
      ).toBeTruthy(),
    );
  });

  it("shows partner settlement panel", async () => {
    render(<ProducerWalletWorkspace />);
    fireEvent.click(screen.getByTestId("producer-wallet-tab-partners"));
    await waitFor(() => expect(screen.getByTestId("producer-partner-settlement-panel")).toBeTruthy());
  });

  it("shows settlement timeline", async () => {
    render(<ProducerWalletWorkspace />);
    fireEvent.click(screen.getByTestId("producer-wallet-tab-timeline"));
    await waitFor(() =>
      expect(
        screen.getByTestId("producer-settlement-timeline-panel") ||
          screen.getByTestId("producer-settlement-timeline-empty"),
      ).toBeTruthy(),
    );
  });

  it("lazy loads commerce wallet shell on activity tab", async () => {
    render(<ProducerWalletWorkspace />);
    fireEvent.click(screen.getByTestId("producer-wallet-tab-activity"));
    await waitFor(() => expect(screen.getByTestId("producer-commerce-wallet-shell")).toBeTruthy());
  });

  it("integrates wallet tab in finance workspace", async () => {
    render(<ProducerFinanceCollectionsWorkspace />);
    fireEvent.click(screen.getByTestId("finance-tab-settlements"));
    await waitFor(() => expect(screen.getByTestId("producer-wallet-workspace")).toBeTruthy());
  });

  it("producer governance prefers bank transfer methods", () => {
    const account = producerWalletAccountSettings({
      commerce_hybrid_settlement_enabled: true,
      commerce_manual_confirmation_enabled: true,
    });
    expect(account.defaultMode).toBe("BANK_TRANSFER_SETTLEMENT");
  });

  it("builds subtle producer settlement hints", () => {
    const hints = buildProducerSettlementHints({
      balance: mockCommerceWalletBalance().payload,
      transactions: mockCommerceTransactions().payload.filter((t) => t.actorRole === "producteur"),
      partners: mockCommercePartnerPayments().payload,
      activity: mockCommercePaymentActivity().payload,
    });
    expect(hints.length).toBeGreaterThan(0);
    expect(hints.map((h) => h.text).join(" ")).not.toMatch(/fintech|crypto|chatbot/i);
  });

  it("sanitizes forbidden jargon", () => {
    expect(sanitizeWalletText("fraud detection chatbot")).not.toMatch(/fraud|chatbot/i);
  });

  it("manual refresh without polling", async () => {
    render(<ProducerWalletWorkspace />);
    fireEvent.click(screen.getByTestId("producer-wallet-refresh"));
    await waitFor(() => expect(screen.getByTestId("producer-wallet-workspace")).toBeTruthy());
  });
});
