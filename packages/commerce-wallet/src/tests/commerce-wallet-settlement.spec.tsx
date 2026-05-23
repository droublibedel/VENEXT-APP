/** @vitest-environment jsdom */
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { CommerceWalletShell } from "../wallet/CommerceWalletShell";
import { CommercePaymentComposer } from "../payments/CommercePaymentComposer";
import { CommerceTransactionList } from "../payments/CommerceTransactionList";
import { CommerceSettlementConfirmationPanel } from "../settlements/CommerceSettlementConfirmationPanel";
import { CommerceSettlementMethodCard } from "../settlements/CommerceSettlementMethodCard";
import { CommerceSettlementPartnerNotice } from "../settlements/CommerceSettlementPartnerNotice";
import { CommerceSettlementStatusBadge } from "../settlements/CommerceSettlementStatusBadge";
import { CommerceSettlementTimeline } from "../settlements/CommerceSettlementTimeline";
import {
  buildSettlementTimeline,
  settlementModeFromMethod,
  transactionToSettlement,
} from "../settlements/commerce-settlement.helpers";
import {
  resolveWalletGovernance,
  defaultCommerceWalletSettings,
  getWalletModeLabel,
} from "../governance/commerce-wallet-governance";
import {
  buildSettlementActivitySignals,
  buildSettlementPartnerSignals,
  buildSettlementStabilityHints,
  sanitizeWalletText,
} from "../intelligence/commerce-wallet-intelligence";
import {
  mockCommercePaymentActivity,
  mockCommercePartnerPayments,
  mockCommerceTransactions,
  mockCommerceWalletBalance,
} from "../mocks/commerce-wallet-mock-data";
import { clearCommerceWalletCache } from "../hooks/useCommerceWalletLiveData";

describe("commerce-wallet hybrid settlement (20.64)", () => {
  afterEach(() => cleanup());

  beforeEach(() => {
    clearCommerceWalletCache();
    vi.stubGlobal("fetch", vi.fn(() => Promise.reject(new Error("offline"))));
  });

  it("resolves CASH_SETTLEMENT governance for cash method", () => {
    const g = resolveWalletGovernance({
      account: defaultCommerceWalletSettings(),
      settlementMethod: "cash",
    });
    expect(g.mode).toBe("CASH_SETTLEMENT");
    expect(g.settlementTrackingOnly).toBe(true);
    expect(g.paymentComposerVisible).toBe(true);
  });

  it("resolves MOBILE_MONEY_SETTLEMENT governance", () => {
    const g = resolveWalletGovernance({
      account: defaultCommerceWalletSettings(),
      settlementMethod: "mobile-money",
    });
    expect(g.mode).toBe("MOBILE_MONEY_SETTLEMENT");
    expect(g.quickActions).toContain("Confirmer mobile money");
  });

  it("resolves BANK_TRANSFER_SETTLEMENT governance", () => {
    const g = resolveWalletGovernance({
      account: defaultCommerceWalletSettings(),
      settlementMethod: "bank-transfer",
    });
    expect(g.mode).toBe("BANK_TRANSFER_SETTLEMENT");
    expect(getWalletModeLabel(g.mode)).toMatch(/Virement/i);
  });

  it("resolves HYBRID_SETTLEMENT governance", () => {
    const g = resolveWalletGovernance({
      account: defaultCommerceWalletSettings(),
      settlementMethod: "hybrid",
    });
    expect(g.mode).toBe("HYBRID_SETTLEMENT");
    expect(g.requiresPartnerConfirmation).toBe(true);
  });

  it("resolves OFF_PLATFORM for manual confirmation", () => {
    const g = resolveWalletGovernance({
      account: defaultCommerceWalletSettings(),
      settlementMethod: "manual-confirmation",
    });
    expect(g.mode).toBe("OFF_PLATFORM_SETTLEMENT");
    expect(g.settlementTrackingOnly).toBe(true);
  });

  it("shows cash settlement badge on transaction list", () => {
    const txs = mockCommerceTransactions().payload;
    render(<CommerceTransactionList transactions={txs} />);
    expect(screen.getByTestId("cw-tx-settlement-tx1")).toBeTruthy();
    expect(screen.getByTestId("cw-tx-settlement-tx1").textContent).toMatch(/cash/i);
  });

  it("renders settlement method card for cash transaction", () => {
    const tx = mockCommerceTransactions().payload.find((t) => t.id === "tx1")!;
    const settlement = transactionToSettlement(tx);
    render(<CommerceSettlementMethodCard settlement={settlement} />);
    expect(screen.getByTestId("cw-settlement-method-card")).toBeTruthy();
    expect(screen.getByTestId("cw-off-platform-notice")).toBeTruthy();
  });

  it("renders commercial settlement timeline", () => {
    const tx = mockCommerceTransactions().payload.find((t) => t.id === "tx2")!;
    const steps = buildSettlementTimeline(transactionToSettlement(tx));
    render(<CommerceSettlementTimeline steps={steps} />);
    expect(screen.getByTestId("cw-settlement-timeline")).toBeTruthy();
    expect(screen.getByTestId("cw-timeline-order-created")).toBeTruthy();
    expect(screen.getByTestId("cw-timeline-settlement-received")).toBeTruthy();
  });

  it("shows partner confirmation notice when required", () => {
    render(
      <CommerceSettlementPartnerNotice
        partnerName="Grossiste importateur"
        confirmed={false}
        required
      />,
    );
    expect(screen.getByTestId("cw-settlement-partner-notice").textContent).toMatch(
      /Confirmation partenaire requise/i,
    );
  });

  it("renders manual confirmation panel with terrain fields", () => {
    const g = resolveWalletGovernance({
      account: defaultCommerceWalletSettings(),
      settlementMethod: "cash",
    });
    render(<CommerceSettlementConfirmationPanel governance={g} />);
    expect(screen.getByTestId("cw-settlement-confirmation-panel")).toBeTruthy();
    expect(screen.getByTestId("cw-terrain-note-input")).toBeTruthy();
    expect(screen.getByTestId("cw-manual-confirmation-submit")).toBeTruthy();
  });

  it("payment composer supports settlement method and reference", () => {
    const g = resolveWalletGovernance({
      account: defaultCommerceWalletSettings(),
      settlementMethod: "mobile-money",
    });
    render(<CommercePaymentComposer governance={g} />);
    expect(screen.getByTestId("cw-composer-method-select")).toBeTruthy();
    expect(screen.getByTestId("cw-composer-reference")).toBeTruthy();
    expect(screen.getByTestId("cw-composer-terrain")).toBeTruthy();
    expect(screen.getByTestId("cw-composer-tracking-notice")).toBeTruthy();
  });

  it("surfaces settlement intelligence without fintech jargon", () => {
    const txs = mockCommerceTransactions().payload;
    const balance = mockCommerceWalletBalance().payload;
    const activity = mockCommercePaymentActivity().payload;
    const partners = mockCommercePartnerPayments().payload;
    const hints = [
      ...buildSettlementActivitySignals(txs),
      ...buildSettlementStabilityHints(balance, activity),
      ...buildSettlementPartnerSignals(partners, txs),
    ];
    const joined = hints.map((h) => h.text).join(" ");
    expect(joined).toMatch(/règlement|commercial|confirmé|partenaire|stable|mobile/i);
    expect(joined).not.toMatch(/fraud|crypto|trading|fintech|scoring/i);
    expect(sanitizeWalletText("fraud detection AI chatbot")).not.toMatch(/fraud|chatbot/i);
  });

  it("maps settlement methods to wallet modes", () => {
    expect(settlementModeFromMethod("cash")).toBe("CASH_SETTLEMENT");
    expect(settlementModeFromMethod("bank-transfer")).toBe("BANK_TRANSFER_SETTLEMENT");
    expect(settlementModeFromMethod("hybrid")).toBe("HYBRID_SETTLEMENT");
  });

  it("shows settlement UI in shell transactions panel", async () => {
    render(<CommerceWalletShell />);
    fireEvent.click(screen.getByTestId("cw-panel-transactions"));
    await waitFor(() => {
      expect(screen.getByTestId("cw-settlement-method-card")).toBeTruthy();
      expect(screen.getByTestId("cw-settlement-timeline")).toBeTruthy();
    });
  });

  it("shows confirmation panel on payments panel", async () => {
    render(<CommerceWalletShell />);
    fireEvent.click(screen.getByTestId("cw-panel-payments"));
    await waitFor(() => {
      expect(screen.getByTestId("cw-settlement-confirmation-panel")).toBeTruthy();
    });
  });

  it("respects WALLET_DISABLED — no composer", () => {
    const g = resolveWalletGovernance({
      account: { ...defaultCommerceWalletSettings(), walletEnabled: false },
    });
    render(<CommercePaymentComposer governance={g} />);
    expect(screen.getByTestId("cw-composer-hidden")).toBeTruthy();
  });

  it("respects READ_ONLY governance", () => {
    const g = resolveWalletGovernance({
      account: defaultCommerceWalletSettings(),
      order: { orderId: "o-ro", scope: "readonly" },
    });
    expect(g.readOnly).toBe(true);
    expect(g.paymentComposerVisible).toBe(false);
    render(<CommercePaymentComposer governance={g} />);
    expect(screen.getByTestId("cw-composer-hidden")).toBeTruthy();
  });

  it("disables hybrid method when flag off on account", () => {
    const account = {
      ...defaultCommerceWalletSettings(),
      hybridSettlementEnabled: false,
    };
    const g = resolveWalletGovernance({ account, settlementMethod: "cash" });
    expect(g.allowedSettlementMethods).not.toContain("hybrid");
  });

  it("renders status badge labels for display", () => {
    render(<CommerceSettlementStatusBadge method="bank-transfer" mode="BANK_TRANSFER_SETTLEMENT" />);
    expect(screen.getByTestId("cw-settlement-status-badge").textContent).toMatch(/Virement/i);
  });

  it("shell disabled state shows commerce message", () => {
    render(<CommerceWalletShell enabled={false} />);
    expect(screen.getByTestId("commerce-wallet-disabled").textContent).toMatch(/bientôt/i);
  });
});
