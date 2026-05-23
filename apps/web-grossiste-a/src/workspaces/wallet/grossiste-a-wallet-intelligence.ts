import {
  buildSettlementActivitySignals,
  buildSettlementPartnerSignals,
  buildSettlementStabilityHints,
  sanitizeWalletText,
  type WalletHint,
} from "commerce-wallet";
import type {
  CommercePartnerPayment,
  CommercePaymentActivity,
  CommerceTransaction,
  CommerceWalletBalance,
} from "commerce-wallet";

export function buildGrossisteSettlementHints(input: {
  balance: CommerceWalletBalance | null;
  transactions: CommerceTransaction[];
  partners: CommercePartnerPayment[];
  activity: CommercePaymentActivity[];
}): WalletHint[] {
  const hints = [
    ...buildSettlementStabilityHints(input.balance, input.activity),
    ...buildSettlementPartnerSignals(input.partners, input.transactions),
    ...buildSettlementActivitySignals(input.transactions),
  ];
  const mobile = input.transactions.find((t) => t.settlementMethod === "mobile-money");
  if (mobile) {
    hints.push({
      id: "gah-mobile",
      text: sanitizeWalletText("Paiement mobile reçu — activité structurée."),
    });
  }
  return hints.slice(0, 4);
}
