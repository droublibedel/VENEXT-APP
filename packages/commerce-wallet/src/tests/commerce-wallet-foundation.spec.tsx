/** @vitest-environment jsdom */
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { CommerceWalletShell } from "../wallet/CommerceWalletShell";
import { CommercePaymentComposer } from "../payments/CommercePaymentComposer";
import { CommerceTransactionList } from "../payments/CommerceTransactionList";
import { clearCommerceWalletCache } from "../hooks/useCommerceWalletLiveData";
import {
  resolveWalletGovernance,
  defaultCommerceWalletSettings,
} from "../governance/commerce-wallet-governance";
import {
  buildPaymentHints,
  buildSettlementSignals,
  buildWalletSignals,
  sanitizeWalletText,
} from "../intelligence/commerce-wallet-intelligence";
import {
  mockCommercePaymentActivity,
  mockCommerceTransactions,
  mockCommerceWalletBalance,
} from "../mocks/commerce-wallet-mock-data";

describe("commerce-wallet foundation", () => {
  afterEach(() => cleanup());

  beforeEach(() => {
    clearCommerceWalletCache();
    vi.stubGlobal("fetch", vi.fn(() => Promise.reject(new Error("offline"))));
  });

  it("renders wallet shell", async () => {
    render(<CommerceWalletShell />);
    await waitFor(() => expect(screen.getByTestId("commerce-wallet-shell")).toBeTruthy());
  });

  it("shows balance card on overview", async () => {
    render(<CommerceWalletShell />);
    await waitFor(() => expect(screen.getByTestId("cw-balance-card")).toBeTruthy());
    expect(screen.getByTestId("cw-balance-available").textContent).toMatch(/FCFA/);
  });

  it("lists virtualized transactions", async () => {
    render(<CommerceWalletShell />);
    fireEvent.click(screen.getByTestId("cw-panel-transactions"));
    await waitFor(() => expect(screen.getByTestId("cw-transaction-list")).toBeTruthy());
    expect(screen.getByTestId("cw-tx-tx1")).toBeTruthy();
  });

  it("shows payment status for active transaction", async () => {
    render(<CommerceWalletShell />);
    fireEvent.click(screen.getByTestId("cw-panel-transactions"));
    await waitFor(() => expect(screen.getByTestId("cw-payment-status")).toBeTruthy());
  });

  it("renders payment composer on payments panel", async () => {
    render(<CommerceWalletShell />);
    fireEvent.click(screen.getByTestId("cw-panel-payments"));
    await waitFor(() => {
      const composer =
        screen.queryByTestId("cw-payment-composer") ?? screen.queryByTestId("cw-composer-hidden");
      expect(composer).toBeTruthy();
    });
    expect(screen.getByTestId("cw-payment-composer")).toBeTruthy();
  });

  it("shows partner payments when governance allows", async () => {
    render(<CommerceWalletShell governanceEnabled />);
    fireEvent.click(screen.getByTestId("cw-panel-partners"));
    await waitFor(() => expect(screen.getByTestId("cw-partner-list")).toBeTruthy());
    expect(screen.getByTestId("cw-partner-pp1")).toBeTruthy();
  });

  it("resolves WALLET_DISABLED governance", () => {
    const account = { ...defaultCommerceWalletSettings(), walletEnabled: false };
    const g = resolveWalletGovernance({ account });
    expect(g.mode).toBe("WALLET_DISABLED");
    expect(g.paymentComposerVisible).toBe(false);
  });

  it("resolves ORDER_LINKED for commande context", () => {
    const account = defaultCommerceWalletSettings();
    const g = resolveWalletGovernance({
      account,
      order: { orderId: "o1", scope: "open", walletMode: "ORDER_LINKED" },
    });
    expect(g.mode).toBe("ORDER_LINKED");
    expect(g.quickActions).toContain("Payer commande");
  });

  it("resolves READ_ONLY for settled order scope", () => {
    const account = defaultCommerceWalletSettings();
    const g = resolveWalletGovernance({
      account,
      order: { orderId: "o1", scope: "readonly" },
    });
    expect(g.mode).toBe("READ_ONLY");
    expect(g.readOnly).toBe(true);
  });

  it("shows fallback data source badge", async () => {
    render(<CommerceWalletShell liveEnabled={false} />);
    await waitFor(() => {
      expect(screen.getByTestId("cw-data-source").getAttribute("data-fallback")).toBe("true");
    });
  });

  it("surfaces discrete wallet intelligence hints", async () => {
    render(<CommerceWalletShell />);
    await waitFor(() => {
      const hints = screen.queryAllByTestId("cw-intelligence-hint");
      expect(hints.length).toBeGreaterThan(0);
    });
    const text = screen
      .queryAllByTestId("cw-intelligence-hint")
      .map((el) => el.textContent ?? "")
      .join(" ");
    expect(text).toMatch(/stable|attente|confirmé|commercial/i);
  });

  it("sanitizes forbidden fintech jargon", () => {
    expect(sanitizeWalletText("chatbot crypto trading fintech scoring")).not.toMatch(
      /chatbot|crypto|trading|fintech|scoring/i,
    );
  });

  it("builds intelligence from mock payloads", () => {
    const balance = mockCommerceWalletBalance().payload;
    const txs = mockCommerceTransactions().payload;
    const activity = mockCommercePaymentActivity().payload;
    const all = [
      ...buildWalletSignals(balance),
      ...buildPaymentHints(txs),
      ...buildSettlementSignals(activity),
    ];
    expect(all.length).toBeGreaterThan(0);
  });

  it("renders transaction list as virtualized list container", () => {
    const txs = mockCommerceTransactions().payload;
    render(
      <CommerceTransactionList transactions={txs} testId="cw-tx-virtual-test" />,
    );
    expect(screen.getByTestId("cw-tx-virtual-test")).toBeTruthy();
    expect(screen.getAllByRole("listitem").length).toBe(txs.length);
  });

  it("hides payment composer when governance disables it", () => {
    const g = resolveWalletGovernance({
      account: { ...defaultCommerceWalletSettings(), walletEnabled: false },
    });
    render(<CommercePaymentComposer governance={g} />);
    expect(screen.getByTestId("cw-composer-hidden")).toBeTruthy();
  });

  it("supports mobile layout tabs", async () => {
    render(<CommerceWalletShell layout="mobile" />);
    await waitFor(() => expect(screen.getByTestId("cw-mobile-tabs")).toBeTruthy());
    fireEvent.click(screen.getByTestId("cw-mobile-tab-transactions"));
    await waitFor(() => expect(screen.getByTestId("cw-panel-active-transactions")).toBeTruthy());
  });

  it("shows only one active panel at a time", async () => {
    render(<CommerceWalletShell />);
    await waitFor(() => expect(screen.getByTestId("cw-panel-active-overview")).toBeTruthy());
    fireEvent.click(screen.getByTestId("cw-panel-payments"));
    await waitFor(() => expect(screen.getByTestId("cw-panel-active-payments")).toBeTruthy());
    expect(screen.queryByTestId("cw-balance-card")).toBeNull();
  });

  it("refreshes on manual refresh without polling", async () => {
    const fetchMock = vi.fn(() => Promise.reject(new Error("offline")));
    vi.stubGlobal("fetch", fetchMock);
    render(<CommerceWalletShell liveEnabled />);
    await waitFor(() => expect(screen.getByTestId("cw-balance-card")).toBeTruthy());
    const before = fetchMock.mock.calls.length;
    fireEvent.click(screen.getByTestId("cw-refresh"));
    await waitFor(() => expect(fetchMock.mock.calls.length).toBeGreaterThan(before));
  });
});
