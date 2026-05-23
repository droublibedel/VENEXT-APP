import type { CommerceTransaction } from "../hooks/commerce-wallet.types";
import type { WalletMode } from "../governance/commerce-wallet-governance.types";
import type {
  CommerceSettlement,
  SettlementMethod,
  SettlementTimelineStep,
} from "./commerce-settlement.types";

export function settlementModeFromMethod(method: SettlementMethod): WalletMode {
  switch (method) {
    case "cash":
      return "CASH_SETTLEMENT";
    case "mobile-money":
      return "MOBILE_MONEY_SETTLEMENT";
    case "bank-transfer":
      return "BANK_TRANSFER_SETTLEMENT";
    case "hybrid":
      return "HYBRID_SETTLEMENT";
    case "manual-confirmation":
      return "OFF_PLATFORM_SETTLEMENT";
    case "wallet":
    default:
      return "PAYMENT_ONLY";
  }
}

export function transactionToSettlement(tx: CommerceTransaction): CommerceSettlement {
  const method = tx.settlementMethod ?? "wallet";
  return {
    id: `stl-${tx.id}`,
    orderId: tx.orderId,
    transactionId: tx.id,
    method,
    mode: tx.settlementMode ?? settlementModeFromMethod(method),
    amountLabel: tx.amountLabel,
    status: tx.status,
    partnerName: tx.partnerName,
    partnerRole: tx.actorRole,
    city: tx.city,
    reference: tx.settlementReference,
    terrainNote: tx.terrainNote,
    partnerConfirmationRequired: tx.partnerConfirmationRequired ?? false,
    partnerConfirmed: tx.status === "settled" || tx.status === "confirmed",
    offPlatform: method !== "wallet",
  };
}

export function buildSettlementTimeline(
  settlement: CommerceSettlement,
): SettlementTimelineStep[] {
  const steps: SettlementTimelineStep[] = [
    { id: "order-created", label: "Commande créée", status: "done", at: "J-2" },
    { id: "delivery-validated", label: "Livraison validée", status: "done", at: "J-1" },
    {
      id: "payment-initiated",
      label: "Paiement initié",
      status: settlement.status === "pending" ? "current" : "done",
      at: "Aujourd'hui",
    },
    {
      id: "partner-confirmation",
      label: "Confirmation partenaire",
      status:
        settlement.partnerConfirmationRequired && !settlement.partnerConfirmed
          ? "current"
          : settlement.partnerConfirmed
            ? "done"
            : "pending",
    },
    {
      id: "settlement-received",
      label: "Règlement reçu",
      status:
        settlement.status === "settled"
          ? "done"
          : settlement.status === "confirmed"
            ? "current"
            : "pending",
    },
    {
      id: "activity-closed",
      label: "Activité clôturée",
      status: settlement.status === "settled" ? "done" : "pending",
    },
  ];
  return steps;
}
