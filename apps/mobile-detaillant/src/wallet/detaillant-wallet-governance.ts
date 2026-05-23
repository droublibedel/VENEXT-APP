import { defaultCommerceWalletSettings, type CommerceWalletAccountSettings } from "commerce-wallet";
import type { SettlementMethod } from "commerce-wallet";

export const RETAIL_SETTLEMENT_METHODS: SettlementMethod[] = [
  "cash",
  "mobile-money",
  "manual-confirmation",
];

export function detaillantWalletAccountSettings(): CommerceWalletAccountSettings {
  return {
    ...defaultCommerceWalletSettings(),
    defaultMode: "CASH_SETTLEMENT",
    partnerPaymentsEnabled: false,
    hybridSettlementEnabled: false,
    manualConfirmationEnabled: true,
  };
}
