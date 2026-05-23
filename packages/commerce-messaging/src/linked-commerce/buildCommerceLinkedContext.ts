import {
  enrichLinkedCommerceContext,
  isRelationshipContextEnabled,
  type CommercialActorRole,
  type CommercialRelationshipGovernanceFlags,
} from "commercial-relationship-governance";

import type { CommerceOrderContext } from "../hooks/commerce-messaging.types";
import type {
  CommerceLinkedContext,
  CommerceLinkedSettlement,
  CommerceLinkedTimelineStep,
} from "./commerce-linked-context.types";

export type BuildCommerceLinkedContextInput = {
  conversationId: string;
  partnerName: string;
  partnerId?: string;
  city: string;
  productName?: string;
  order?: CommerceOrderContext | null;
  settlement?: CommerceLinkedSettlement | null;
  actorRole?: CommercialActorRole;
  partnerRole?: CommercialActorRole;
  relationshipFlags?: CommercialRelationshipGovernanceFlags;
};

const SETTLEMENT_LABEL: Record<CommerceLinkedSettlement["method"], string> = {
  cash: "Réglé en cash",
  "mobile-money": "Paiement mobile",
  "bank-transfer": "Virement bancaire",
  wallet: "Wallet VENEXT",
  hybrid: "Règlement hybride",
  "manual-confirmation": "Confirmation terrain",
};

export function settlementStatusLabel(settlement: CommerceLinkedSettlement): string {
  return settlement.statusLabel || SETTLEMENT_LABEL[settlement.method] || "Suivi règlement";
}

export function buildCommerceLinkedTimeline(input: {
  productName?: string;
  order?: CommerceOrderContext | null;
  settlement?: CommerceLinkedSettlement | null;
}): CommerceLinkedTimelineStep[] {
  const hasOrder = Boolean(input.order);
  const settled =
    input.settlement?.statusLabel.toLowerCase().includes("réglé") ||
    input.settlement?.statusLabel.toLowerCase().includes("confirmé");
  const pendingSettlement = input.settlement && !settled;

  return [
    {
      id: "product-shared",
      label: "Produit partagé",
      status: input.productName ? "done" : "pending",
      at: input.productName ? "J-2" : undefined,
    },
    {
      id: "discussion-open",
      label: "Discussion ouverte",
      status: "done",
      at: "J-1",
    },
    {
      id: "order-created",
      label: "Commande créée",
      status: hasOrder ? "done" : input.productName ? "current" : "pending",
      at: hasOrder ? "Aujourd'hui" : undefined,
    },
    {
      id: "partner-validation",
      label: "Validation partenaire",
      status: hasOrder ? (pendingSettlement ? "current" : "done") : "pending",
    },
    {
      id: "delivery",
      label: "Livraison",
      status:
        input.order?.delivery?.toLowerCase().includes("cours") ||
        input.order?.status?.toLowerCase().includes("livraison")
          ? "current"
          : hasOrder
            ? "done"
            : "pending",
    },
    {
      id: "settlement-confirmed",
      label: "Règlement confirmé",
      status: settled ? "done" : pendingSettlement ? "current" : "pending",
    },
    {
      id: "activity-closed",
      label: "Activité clôturée",
      status: settled ? "done" : "pending",
    },
  ];
}

export function buildCommerceLinkedContext(
  input: BuildCommerceLinkedContextInput,
): CommerceLinkedContext {
  const order = input.order ?? null;
  const settlement = input.settlement ?? null;

  const relationship =
    input.actorRole &&
    input.partnerRole &&
    isRelationshipContextEnabled(input.relationshipFlags)
      ? enrichLinkedCommerceContext(
          { self: input.actorRole, partner: input.partnerRole },
          { flags: input.relationshipFlags },
        )
      : undefined;

  return {
    conversationId: input.conversationId,
    partnerName: input.partnerName,
    partnerId: input.partnerId,
    city: input.city,
    productName: input.productName,
    order,
    settlement,
    timeline: buildCommerceLinkedTimeline({
      productName: input.productName,
      order,
      settlement,
    }),
    relationship: relationship
      ? {
          relationshipLabel: relationship.linkedLabel,
          communicationMode: relationship.communicationMode,
          identityMode: relationship.identityMode,
          preferMail: relationship.preferMail,
          preferMessaging: relationship.preferMessaging,
        }
      : undefined,
  };
}

/** Infer a light settlement stub from order when no wallet row is injected. */
export function inferSettlementFromOrder(
  order: CommerceOrderContext | null,
): CommerceLinkedSettlement | null {
  if (!order) return null;
  const status = order.status.toLowerCase();
  if (status.includes("réglé") || status.includes("confirmé")) {
    return {
      transactionId: `stl-${order.orderId}`,
      method: "manual-confirmation",
      statusLabel: "Règlement confirmé",
      amountLabel: order.amountLabel,
      partnerConfirmed: true,
    };
  }
  if (status.includes("attente") || status.includes("valider")) {
    return {
      transactionId: `stl-${order.orderId}`,
      method: "mobile-money",
      statusLabel: "Confirmation en attente",
      amountLabel: order.amountLabel,
      partnerConfirmed: false,
    };
  }
  return {
    transactionId: `stl-${order.orderId}`,
    method: "cash",
    statusLabel: "Suivi règlement",
    amountLabel: order.amountLabel,
  };
}
