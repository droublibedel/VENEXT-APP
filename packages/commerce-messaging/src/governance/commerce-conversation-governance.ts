import type {
  CommerceMessagingAccountSettings,
  CommerceOrderConversationGovernance,
  CommerceProductConversationSettings,
  ConversationGovernanceInput,
  ConversationMode,
  ResolvedConversationGovernance,
} from "./commerce-conversation-governance.types";
import {
  buildMessagingAccessContext,
  canUseFormalMailWithAccess,
  canUseTerrainMessagingWithAccess,
  isParticipantMessagingAllowed,
} from "../commerce-messaging-access-bridge";

export const GOVERNANCE_BADGE_LABELS: Record<ConversationMode, string> = {
  DISABLED: "Discussion désactivée",
  FIXED_PRICE_ONLY: "Prix fixe",
  NEGOTIABLE: "Négociable",
  PARTNER_ONLY: "Partenaires uniquement",
  ORDER_CONTEXT_ONLY: "Commande uniquement",
};

export const FIXED_PRICE_COMPOSER_SUGGESTIONS = [
  "Commande validée",
  "Disponibilité confirmée",
] as const;

export const DELIVERY_ONLY_COMPOSER_SUGGESTIONS = [
  "Livraison en cours",
  "Créneau confirmé",
  "Commande prête",
] as const;

export const NEGOTIABLE_COMPOSER_SUGGESTIONS = [
  "Produit disponible",
  "Stock limité",
  "Besoin confirmation",
  "Activité forte aujourd'hui",
] as const;

export function getGovernanceBadgeLabel(mode: ConversationMode): string {
  return GOVERNANCE_BADGE_LABELS[mode];
}

export function isPartnerAuthorized(
  account: CommerceMessagingAccountSettings,
  partnerId?: string,
): boolean {
  if (!partnerId) return !account.partnersOnly;
  if (!account.partnersOnly) return true;
  return account.authorizedPartnerIds.includes(partnerId);
}

function orderRestrictedMode(
  order: CommerceOrderConversationGovernance,
): ConversationMode {
  if (order.conversationMode) return order.conversationMode;
  if (order.scope === "readonly") return "ORDER_CONTEXT_ONLY";
  if (order.scope === "delivery-only") return "ORDER_CONTEXT_ONLY";
  return "NEGOTIABLE";
}

function orderNotice(order: CommerceOrderConversationGovernance): string | undefined {
  if (order.scope === "readonly") return "Discussion liée à cette commande — lecture seule.";
  if (order.scope === "delivery-only") return "Discussion limitée au suivi livraison.";
  return "Discussion liée à cette commande.";
}

function productNotice(product: CommerceProductConversationSettings): string | undefined {
  if (!product.conversationEnabled) return undefined;
  if (product.conversationMode === "FIXED_PRICE_ONLY") return "Produit en prix fixe.";
  if (product.conversationMode === "PARTNER_ONLY") return "Conversation réservée partenaires.";
  return undefined;
}

export function resolveConversationGovernance(
  input: ConversationGovernanceInput,
  accessBridge?: Parameters<typeof buildMessagingAccessContext>[0],
): ResolvedConversationGovernance {
  const { account, product, order } = input;
  const partnerAuthorized =
    input.partnerAuthorized ?? isPartnerAuthorized(account, input.partnerId);

  if (accessBridge && accessBridge.flags?.commerce_access_control_enabled !== false) {
    const ctx = buildMessagingAccessContext(accessBridge);
    if (!isParticipantMessagingAllowed(ctx)) {
      return resolved("DISABLED", partnerAuthorized, { order, product, composerVisible: false });
    }
    const terrainOk = canUseTerrainMessagingWithAccess(ctx, () => account.messagingEnabled);
    const formalOk = canUseFormalMailWithAccess(ctx, () => account.messagingEnabled);
    if (!terrainOk && !formalOk) {
      return resolved("DISABLED", partnerAuthorized, { order, product, composerVisible: false });
    }
  }

  if (!account.messagingEnabled) {
    return resolved("DISABLED", partnerAuthorized, { order, product });
  }

  if (product && !product.conversationEnabled) {
    return resolved("DISABLED", partnerAuthorized, { order, product });
  }

  if (order?.scope === "readonly") {
    return resolved("ORDER_CONTEXT_ONLY", partnerAuthorized, {
      order,
      product,
      composerVisible: false,
    });
  }

  let mode: ConversationMode = account.defaultMode;

  if (product?.conversationEnabled && product.conversationMode !== "DISABLED") {
    mode = product.conversationMode;
  } else if (order) {
    mode = orderRestrictedMode(order);
  } else if (account.partnersOnly) {
    mode = "PARTNER_ONLY";
  }

  if (order?.scope === "delivery-only" && mode !== "DISABLED") {
    mode = "ORDER_CONTEXT_ONLY";
  }

  return resolved(mode, partnerAuthorized, { order, product });
}

function resolved(
  mode: ConversationMode,
  partnerAuthorized: boolean,
  opts: {
    order?: CommerceOrderConversationGovernance | null;
    product?: CommerceProductConversationSettings | null;
    composerVisible?: boolean;
  },
): ResolvedConversationGovernance {
  const badgeLabel = getGovernanceBadgeLabel(mode);
  let composerVisible = opts.composerVisible ?? mode !== "DISABLED";
  let composerSuggestions: readonly string[] = NEGOTIABLE_COMPOSER_SUGGESTIONS;

  if (mode === "DISABLED") {
    composerVisible = false;
    composerSuggestions = [];
  } else if (mode === "FIXED_PRICE_ONLY") {
    composerSuggestions = FIXED_PRICE_COMPOSER_SUGGESTIONS;
  } else if (mode === "ORDER_CONTEXT_ONLY") {
    composerSuggestions =
      opts.order?.scope === "delivery-only"
        ? DELIVERY_ONLY_COMPOSER_SUGGESTIONS
        : DELIVERY_ONLY_COMPOSER_SUGGESTIONS;
    if (opts.order?.scope === "readonly") composerVisible = false;
  } else if (mode === "PARTNER_ONLY") {
    composerVisible = partnerAuthorized;
    composerSuggestions = partnerAuthorized
      ? NEGOTIABLE_COMPOSER_SUGGESTIONS
      : [];
  }

  return {
    mode,
    badgeLabel,
    composerVisible,
    composerSuggestions,
    partnerAuthorized,
    orderNotice: opts.order ? orderNotice(opts.order) : undefined,
    productNotice: opts.product ? productNotice(opts.product) : undefined,
  };
}

export function defaultCommerceAccountSettings(): CommerceMessagingAccountSettings {
  return {
    messagingEnabled: true,
    defaultMode: "NEGOTIABLE",
    partnersOnly: false,
    authorizedPartnerIds: [],
  };
}
