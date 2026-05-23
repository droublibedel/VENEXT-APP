import type { WalletActorRole, PaymentStatus } from "../hooks/commerce-wallet.types";
import type { WalletMode } from "../governance/commerce-wallet-governance.types";

export type SettlementMethod =
  | "cash"
  | "mobile-money"
  | "bank-transfer"
  | "wallet"
  | "hybrid"
  | "manual-confirmation";

export type SettlementTimelineStepId =
  | "order-created"
  | "delivery-validated"
  | "payment-initiated"
  | "partner-confirmation"
  | "settlement-received"
  | "activity-closed";

export type SettlementTimelineStep = {
  id: SettlementTimelineStepId;
  label: string;
  status: "done" | "current" | "pending";
  at?: string;
};

export type CommerceSettlement = {
  id: string;
  orderId?: string;
  transactionId?: string;
  method: SettlementMethod;
  mode: WalletMode;
  amountLabel: string;
  status: PaymentStatus;
  partnerName?: string;
  partnerRole?: WalletActorRole;
  city: string;
  reference?: string;
  terrainNote?: string;
  partnerConfirmationRequired: boolean;
  partnerConfirmed: boolean;
  offPlatform: boolean;
};

export const SETTLEMENT_METHOD_LABELS: Record<SettlementMethod, string> = {
  cash: "Cash",
  "mobile-money": "Mobile money",
  "bank-transfer": "Virement bancaire",
  wallet: "Wallet VENEXT",
  hybrid: "Règlement hybride",
  "manual-confirmation": "Confirmation manuelle",
};

export const SETTLEMENT_STATUS_DISPLAY: Record<SettlementMethod, string> = {
  cash: "Réglé en cash",
  "mobile-money": "Paiement mobile confirmé",
  "bank-transfer": "Virement en attente",
  wallet: "Paiement wallet",
  hybrid: "Règlement hybride",
  "manual-confirmation": "Confirmation partenaire requise",
};
