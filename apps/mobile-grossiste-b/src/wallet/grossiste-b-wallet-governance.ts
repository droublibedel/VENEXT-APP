import { defaultCommerceWalletSettings, type CommerceWalletAccountSettings } from "commerce-wallet";
import type { SettlementMethod } from "commerce-wallet";

export const GROSSISTE_B_SETTLEMENT_METHODS: SettlementMethod[] = [
  "mobile-money",
  "cash",
  "hybrid",
];

export function grossisteBWalletAccountSettings(flags: {
  commerce_hybrid_settlement_enabled?: boolean;
}): CommerceWalletAccountSettings {
  return {
    ...defaultCommerceWalletSettings(),
    defaultMode: "MOBILE_MONEY_SETTLEMENT",
    partnerPaymentsEnabled: true,
    hybridSettlementEnabled: flags.commerce_hybrid_settlement_enabled !== false,
    manualConfirmationEnabled: true,
  };
}
