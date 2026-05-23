import type { SettlementMethod } from "../settlements/commerce-settlement.types";

export type WalletMode =
  | "WALLET_DISABLED"
  | "PAYMENT_ONLY"
  | "PARTNER_SETTLEMENT"
  | "ORDER_LINKED"
  | "READ_ONLY"
  | "OFF_PLATFORM_SETTLEMENT"
  | "CASH_SETTLEMENT"
  | "MOBILE_MONEY_SETTLEMENT"
  | "BANK_TRANSFER_SETTLEMENT"
  | "HYBRID_SETTLEMENT";

export type CommerceWalletAccountSettings = {
  walletEnabled: boolean;
  defaultMode: WalletMode;
  partnerPaymentsEnabled: boolean;
  authorizedPartnerIds: string[];
  orderLinkedPayments: boolean;
  hybridSettlementEnabled: boolean;
  manualConfirmationEnabled: boolean;
};

export type CommerceOrderPaymentGovernance = {
  orderId: string;
  scope: "open" | "readonly" | "settlement-only";
  walletMode?: WalletMode;
  settlementMethod?: SettlementMethod;
};

export type WalletGovernanceInput = {
  account: CommerceWalletAccountSettings;
  order?: CommerceOrderPaymentGovernance | null;
  partnerId?: string;
  partnerAuthorized?: boolean;
  settlementMethod?: SettlementMethod;
};

export type ResolvedWalletGovernance = {
  mode: WalletMode;
  paymentComposerVisible: boolean;
  partnerPaymentsVisible: boolean;
  readOnly: boolean;
  settlementTrackingOnly: boolean;
  requiresPartnerConfirmation: boolean;
  allowedSettlementMethods: SettlementMethod[];
  notice?: string;
  quickActions: readonly string[];
};
