import {
  defaultCommerceWalletSettings,
  type CommerceWalletAccountSettings,
} from "commerce-wallet";
import type { SettlementMethod } from "commerce-wallet";

export const GROSSISTE_A_SETTLEMENT_METHODS: SettlementMethod[] = [
  "bank-transfer",
  "mobile-money",
  "hybrid",
];

export function grossisteAWalletAccountSettings(flags: {
  commerce_hybrid_settlement_enabled?: boolean;
}): CommerceWalletAccountSettings {
  return {
    ...defaultCommerceWalletSettings(),
    defaultMode: "PARTNER_SETTLEMENT",
    partnerPaymentsEnabled: true,
    hybridSettlementEnabled: flags.commerce_hybrid_settlement_enabled !== false,
    manualConfirmationEnabled: true,
  };
}
