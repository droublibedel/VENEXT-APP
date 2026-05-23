import {
  buildSettlementActivitySignals,
  buildSettlementStabilityHints,
  sanitizeWalletText,
  type WalletHint,
} from "commerce-wallet";
import type {
  CommercePaymentActivity,
  CommerceTransaction,
  CommerceWalletBalance,
} from "commerce-wallet";

export function buildGrossisteSettlementHints(input: {
  balance: CommerceWalletBalance | null;
  transactions: CommerceTransaction[];
  activity: CommercePaymentActivity[];
}): WalletHint[] {
  const hints = [
    ...buildSettlementStabilityHints(input.balance, input.activity),
    ...buildSettlementActivitySignals(input.transactions),
  ];
  const cash = input.transactions.find((t) => t.settlementMethod === "cash");
  if (cash) {
    hints.push({
      id: "gbh-cash",
      text: sanitizeWalletText("Flux terrain stable — cash confirmé."),
    });
  }
  return hints.slice(0, 3);
}
