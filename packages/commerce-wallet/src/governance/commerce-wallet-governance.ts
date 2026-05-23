import type { SettlementMethod } from "../settlements/commerce-settlement.types";
import { settlementModeFromMethod } from "../settlements/commerce-settlement.helpers";
import type {
  CommerceOrderPaymentGovernance,
  CommerceWalletAccountSettings,
  ResolvedWalletGovernance,
  WalletGovernanceInput,
  WalletMode,
} from "./commerce-wallet-governance.types";
import {
  buildWalletAccessContext,
  canSettleWithAccess,
  canUseWalletWithAccess,
  type WalletAccessBridgeInput,
} from "../commerce-wallet-access-bridge";

export const WALLET_MODE_LABELS: Record<WalletMode, string> = {
  WALLET_DISABLED: "Wallet désactivé",
  PAYMENT_ONLY: "Paiement direct",
  PARTNER_SETTLEMENT: "Règlement partenaire",
  ORDER_LINKED: "Lié commande",
  READ_ONLY: "Consultation",
  OFF_PLATFORM_SETTLEMENT: "Hors plateforme",
  CASH_SETTLEMENT: "Règlement cash",
  MOBILE_MONEY_SETTLEMENT: "Mobile money",
  BANK_TRANSFER_SETTLEMENT: "Virement bancaire",
  HYBRID_SETTLEMENT: "Règlement hybride",
};

export const PAYMENT_ONLY_ACTIONS = [
  "Confirmer paiement",
  "Voir statut",
  "Marquer reçu",
] as const;

export const PARTNER_SETTLEMENT_ACTIONS = [
  "Confirmer règlement",
  "Paiement partenaire",
  "Suivi encaissement",
] as const;

export const ORDER_LINKED_ACTIONS = [
  "Payer commande",
  "Confirmer réception",
  "Suivre règlement",
] as const;

export const CASH_SETTLEMENT_ACTIONS = [
  "Confirmer réception cash",
  "Référence terrain",
  "Marquer réglé",
] as const;

export const MOBILE_MONEY_ACTIONS = [
  "Confirmer mobile money",
  "Référence paiement",
  "Attente confirmation",
] as const;

export const BANK_TRANSFER_ACTIONS = [
  "Virement initié",
  "Référence virement",
  "Confirmer réception",
] as const;

export const HYBRID_SETTLEMENT_ACTIONS = [
  "Partie cash confirmée",
  "Partie mobile confirmée",
  "Clôturer règlement",
] as const;

export const OFF_PLATFORM_ACTIONS = [
  "Confirmer hors plateforme",
  "Référence règlement",
  "Validation terrain",
] as const;

const ALL_SETTLEMENT_METHODS: SettlementMethod[] = [
  "cash",
  "mobile-money",
  "bank-transfer",
  "wallet",
  "hybrid",
  "manual-confirmation",
];

export function defaultCommerceWalletSettings(): CommerceWalletAccountSettings {
  return {
    walletEnabled: true,
    defaultMode: "PAYMENT_ONLY",
    partnerPaymentsEnabled: true,
    authorizedPartnerIds: [],
    orderLinkedPayments: true,
    hybridSettlementEnabled: true,
    manualConfirmationEnabled: true,
  };
}

export function isWalletPartnerAuthorized(
  account: CommerceWalletAccountSettings,
  partnerId?: string,
): boolean {
  if (!partnerId) return true;
  if (!account.authorizedPartnerIds.length) return true;
  return account.authorizedPartnerIds.includes(partnerId);
}

function allowedMethods(account: CommerceWalletAccountSettings): SettlementMethod[] {
  return ALL_SETTLEMENT_METHODS.filter((m) => {
    if (m === "hybrid" && !account.hybridSettlementEnabled) return false;
    if (m === "manual-confirmation" && !account.manualConfirmationEnabled) return false;
    return true;
  });
}

export function resolveWalletGovernance(
  input: WalletGovernanceInput,
  accessBridge?: WalletAccessBridgeInput,
): ResolvedWalletGovernance {
  const { account, order } = input;
  const partnerAuthorized =
    input.partnerAuthorized ?? isWalletPartnerAuthorized(account, input.partnerId);
  const methods = allowedMethods(account);

  if (accessBridge && accessBridge.commerce_access_control_enabled !== false) {
    const ctx = buildWalletAccessContext(accessBridge);
    if (!canUseWalletWithAccess(ctx, () => account.walletEnabled)) {
      return resolved("WALLET_DISABLED", partnerAuthorized, { order }, methods);
    }
    if (input.settlementMethod && !canSettleWithAccess(ctx)) {
      return resolved("READ_ONLY", partnerAuthorized, { order }, methods);
    }
  }

  if (!account.walletEnabled) {
    return resolved("WALLET_DISABLED", partnerAuthorized, { order }, methods);
  }

  if (order?.scope === "readonly") {
    return resolved("READ_ONLY", partnerAuthorized, { order }, methods);
  }

  const method = input.settlementMethod ?? order?.settlementMethod;
  if (method) {
    const mode = settlementModeFromMethod(method);
    return resolved(mode, partnerAuthorized, { order, method }, methods);
  }

  if (order) {
    const mode = order.walletMode ?? "ORDER_LINKED";
    return resolved(mode, partnerAuthorized, { order }, methods);
  }

  if (account.partnerPaymentsEnabled && partnerAuthorized) {
    return resolved("PARTNER_SETTLEMENT", partnerAuthorized, { order }, methods);
  }

  return resolved(account.defaultMode, partnerAuthorized, { order }, methods);
}

function isSettlementTrackingMode(mode: WalletMode): boolean {
  return (
    mode === "OFF_PLATFORM_SETTLEMENT" ||
    mode === "CASH_SETTLEMENT" ||
    mode === "MOBILE_MONEY_SETTLEMENT" ||
    mode === "BANK_TRANSFER_SETTLEMENT" ||
    mode === "HYBRID_SETTLEMENT"
  );
}

function quickActionsForMode(mode: WalletMode): readonly string[] {
  switch (mode) {
    case "CASH_SETTLEMENT":
      return CASH_SETTLEMENT_ACTIONS;
    case "MOBILE_MONEY_SETTLEMENT":
      return MOBILE_MONEY_ACTIONS;
    case "BANK_TRANSFER_SETTLEMENT":
      return BANK_TRANSFER_ACTIONS;
    case "HYBRID_SETTLEMENT":
      return HYBRID_SETTLEMENT_ACTIONS;
    case "OFF_PLATFORM_SETTLEMENT":
      return OFF_PLATFORM_ACTIONS;
    case "ORDER_LINKED":
      return ORDER_LINKED_ACTIONS;
    case "PARTNER_SETTLEMENT":
      return PARTNER_SETTLEMENT_ACTIONS;
    default:
      return PAYMENT_ONLY_ACTIONS;
  }
}

function resolved(
  mode: WalletMode,
  partnerAuthorized: boolean,
  ctx: {
    order?: CommerceOrderPaymentGovernance | null;
    method?: SettlementMethod;
  },
  allowedSettlementMethods: SettlementMethod[],
): ResolvedWalletGovernance {
  if (mode === "WALLET_DISABLED") {
    return {
      mode,
      paymentComposerVisible: false,
      partnerPaymentsVisible: false,
      readOnly: true,
      settlementTrackingOnly: true,
      requiresPartnerConfirmation: false,
      allowedSettlementMethods: [],
      notice: "Wallet commercial désactivé pour ce compte.",
      quickActions: [],
    };
  }

  if (mode === "READ_ONLY") {
    return {
      mode,
      paymentComposerVisible: false,
      partnerPaymentsVisible: false,
      readOnly: true,
      settlementTrackingOnly: true,
      requiresPartnerConfirmation: false,
      allowedSettlementMethods: allowedSettlementMethods,
      notice: "Consultation des règlements — sans action de paiement.",
      quickActions: [],
    };
  }

  if (!partnerAuthorized) {
    return {
      mode: "PARTNER_SETTLEMENT",
      paymentComposerVisible: false,
      partnerPaymentsVisible: false,
      readOnly: true,
      settlementTrackingOnly: true,
      requiresPartnerConfirmation: true,
      allowedSettlementMethods: allowedSettlementMethods,
      notice: "Règlement réservé aux partenaires autorisés.",
      quickActions: [],
    };
  }

  const tracking = isSettlementTrackingMode(mode);
  const requiresPartner =
    ctx.method === "manual-confirmation" ||
    mode === "OFF_PLATFORM_SETTLEMENT" ||
    mode === "HYBRID_SETTLEMENT";

  return {
    mode,
    paymentComposerVisible: true,
    partnerPaymentsVisible: mode === "PARTNER_SETTLEMENT",
    readOnly: false,
    settlementTrackingOnly: tracking,
    requiresPartnerConfirmation: requiresPartner,
    allowedSettlementMethods: allowedSettlementMethods,
    notice: settlementNotice(mode, ctx.order, ctx.method),
    quickActions: quickActionsForMode(mode),
  };
}

function settlementNotice(
  mode: WalletMode,
  order?: CommerceOrderPaymentGovernance | null,
  method?: SettlementMethod,
): string | undefined {
  if (mode === "OFF_PLATFORM_SETTLEMENT") {
    return "Règlement hors plateforme — suivi et confirmation terrain.";
  }
  if (mode === "CASH_SETTLEMENT") {
    return "Règlement cash — confirmation terrain sans paiement électronique obligatoire.";
  }
  if (mode === "MOBILE_MONEY_SETTLEMENT") {
    return "Mobile money — confirmer la réception sur le terrain.";
  }
  if (mode === "BANK_TRANSFER_SETTLEMENT") {
    return "Virement bancaire — suivi du règlement commercial.";
  }
  if (mode === "HYBRID_SETTLEMENT") {
    return "Règlement hybride — cash et électronique possibles.";
  }
  if (order?.scope === "settlement-only") {
    return "Suivi commercial lié à la commande — paiement électronique non requis.";
  }
  return orderNotice(order);
}

function orderNotice(order?: CommerceOrderPaymentGovernance | null): string | undefined {
  if (!order) return undefined;
  if (order.scope === "settlement-only") {
    return "Activité commerciale liée à la commande — visibilité règlement.";
  }
  if (order.scope === "readonly") return "Historique commande — consultation uniquement.";
  return "Règlement commercial lié à une commande.";
}

export function getWalletModeLabel(mode: WalletMode): string {
  return WALLET_MODE_LABELS[mode];
}
