import {
  buildPaymentHints,
  buildSettlementActivitySignals,
  sanitizeWalletText,
  type WalletHint,
} from "commerce-wallet";
import type { CommerceTransaction } from "commerce-wallet";

export function buildRetailSettlementHints(transactions: CommerceTransaction[]): WalletHint[] {
  const hints = [...buildPaymentHints(transactions), ...buildSettlementActivitySignals(transactions)];
  const mobile = transactions.find((t) => t.settlementMethod === "mobile-money");
  if (mobile) {
    hints.push({
      id: "drh-mobile",
      text: sanitizeWalletText("Paiement mobile reçu."),
    });
  }
  const cash = transactions.find((t) => t.settlementMethod === "cash" && t.status === "settled");
  if (cash) {
    hints.push({
      id: "drh-cash",
      text: sanitizeWalletText("Réglé en cash — simple et rapide."),
    });
  }
  return hints.slice(0, 2);
}
