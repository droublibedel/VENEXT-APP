import {
  buildSettlementActivitySignals,
  buildSettlementPartnerSignals,
  buildSettlementStabilityHints,
  sanitizeWalletText,
} from "commerce-wallet";
import type { WalletHint } from "commerce-wallet";
import type {
  CommercePartnerPayment,
  CommercePaymentActivity,
  CommerceTransaction,
  CommerceWalletBalance,
} from "commerce-wallet";

export function buildProducerSettlementHints(input: {
  balance: CommerceWalletBalance | null;
  transactions: CommerceTransaction[];
  partners: CommercePartnerPayment[];
  activity: CommercePaymentActivity[];
}): WalletHint[] {
  const hints: WalletHint[] = [
    ...buildSettlementStabilityHints(input.balance, input.activity),
    ...buildSettlementPartnerSignals(input.partners, input.transactions),
    ...buildSettlementActivitySignals(input.transactions),
  ];
  const transfer = input.transactions.find((t) => t.settlementMethod === "bank-transfer");
  if (transfer?.status === "pending") {
    hints.push({
      id: "pwh-transfer-pending",
      text: sanitizeWalletText("Virement en attente — suivi partenaire réseau."),
    });
  }
  const confirmed = input.transactions.find((t) => t.status === "settled");
  if (confirmed) {
    hints.push({
      id: "pwh-partner-confirmed",
      text: sanitizeWalletText("Règlement partenaire confirmé."),
    });
  }
  return hints.slice(0, 4);
}
