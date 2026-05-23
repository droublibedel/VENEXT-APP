import {
  defaultCommerceWalletSettings,
  resolveWalletGovernance,
} from "commerce-wallet";
import type { CommerceWalletAccountSettings } from "commerce-wallet";
import type { SettlementMethod } from "commerce-wallet";

export const PRODUCER_SETTLEMENT_METHODS: SettlementMethod[] = [
  "bank-transfer",
  "hybrid",
  "manual-confirmation",
];

export function producerWalletAccountSettings(flags: {
  commerce_hybrid_settlement_enabled?: boolean;
  commerce_manual_confirmation_enabled?: boolean;
}): CommerceWalletAccountSettings {
  return {
    ...defaultCommerceWalletSettings(),
    defaultMode: "BANK_TRANSFER_SETTLEMENT",
    partnerPaymentsEnabled: true,
    orderLinkedPayments: true,
    hybridSettlementEnabled: flags.commerce_hybrid_settlement_enabled !== false,
    manualConfirmationEnabled: flags.commerce_manual_confirmation_enabled !== false,
  };
}

export function producerAllowedSettlementMethods(
  account: CommerceWalletAccountSettings,
): SettlementMethod[] {
  return PRODUCER_SETTLEMENT_METHODS.filter((m) => {
    if (m === "hybrid" && !account.hybridSettlementEnabled) return false;
    if (m === "manual-confirmation" && !account.manualConfirmationEnabled) return false;
    return true;
  });
}

export function resolveProducerWalletGovernance(
  account: CommerceWalletAccountSettings,
  settlementMethod?: SettlementMethod,
) {
  const method = settlementMethod ?? "bank-transfer";
  return resolveWalletGovernance({ account, settlementMethod: method });
}
