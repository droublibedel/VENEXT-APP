import { Injectable } from "@nestjs/common";
import { MessageType } from "@prisma/client";
import type {
  CommerceCapabilityMarker,
  ConversationalCommerceResponse,
  ConversationalStructuredMessage,
  ConversationalThreadRow,
} from "@venext/shared-contracts";
import type { OrderAdvRawSnapshot } from "../order-adv-intelligence/order-adv-data.service";

function summarizeStructuredEvent(ev: unknown): string | null {
  if (ev == null) return null;
  if (typeof ev === "object" && ev !== null && "kind" in ev && typeof (ev as { kind: unknown }).kind === "string") {
    return `kind:${(ev as { kind: string }).kind}`;
  }
  try {
    return JSON.stringify(ev).slice(0, 160);
  } catch {
    return "structured";
  }
}

@Injectable()
export class ConversationalCommerceService {
  build(snapshot: OrderAdvRawSnapshot, enabled: boolean): ConversationalCommerceResponse {
    const { organizationId, generatedAt, threads, reservationIntents } = snapshot;

    const capabilities: CommerceCapabilityMarker[] = [
      {
        key: "conversational_cart_order_mutation",
        available: false,
        reason: "EVENT_TYPE_NOT_IMPLEMENTED_YET",
      },
      {
        key: "cart_conversion_from_messages",
        available: true,
      },
    ];

    if (!enabled) {
      return {
        generatedAt,
        organizationId,
        policy: "DISABLED",
        threads: [],
        commerceThroughMessagingIndex: 0,
        capabilities,
        moduleNote: "conversational_commerce_enabled",
      };
    }

    const intentByNegotiation = new Map<string, typeof reservationIntents>();
    const intentByOrder = new Map<string, typeof reservationIntents>();
    for (const ri of reservationIntents) {
      if (ri.negotiationId) {
        const arr = intentByNegotiation.get(ri.negotiationId) ?? [];
        arr.push(ri);
        intentByNegotiation.set(ri.negotiationId, arr);
      }
      if (ri.orderId) {
        const arr = intentByOrder.get(ri.orderId) ?? [];
        arr.push(ri);
        intentByOrder.set(ri.orderId, arr);
      }
    }

    const rows: ConversationalThreadRow[] = threads.slice(0, 48).map((t) => {
      const anchors: string[] = [];
      if (t.productId) anchors.push(`product:${t.productId}`);
      if (t.orderId) anchors.push(`order:${t.orderId}`);
      if (t.negotiationId) anchors.push(`negotiation:${t.negotiationId}`);
      const msgs = snapshot.messageCountByThread.get(t.id) ?? 0;
      const tension = Math.min(1, msgs / 40 + (t.negotiationId || t.orderId ? 0.25 : 0.05));

      const rawMsgs = snapshot.latestMessagesByThread.get(t.id) ?? [];
      const latestStructuredMessages: ConversationalStructuredMessage[] = rawMsgs.map((m) => ({
        messageId: m.id,
        messageType: String(m.messageType),
        createdAt: m.createdAt.toISOString(),
        structuredEventSummary: summarizeStructuredEvent(m.structuredEvent),
      }));

      const cartConversionMessageCount = rawMsgs.filter((m) => m.messageType === MessageType.CART_CONVERSION_EVENT).length;

      const resSignals =
        (t.negotiationId ? intentByNegotiation.get(t.negotiationId) : undefined) ??
        (t.orderId ? intentByOrder.get(t.orderId) : undefined) ??
        [];
      const conversationalReservationSignals = resSignals.slice(0, 4).map((ri) => ({
        intentId: ri.id,
        status: String(ri.status),
        source: String(ri.source),
      }));

      const productLinked = Boolean(t.productId);
      const negotiationLinked = Boolean(t.negotiationId);
      const pinnedProductLabel = t.product?.name ?? null;

      return {
        threadId: t.id,
        threadType: String(t.threadType),
        commerceAnchors: anchors.length ? anchors : ["context:GENERAL_BUSINESS"],
        lastActivityAt: t.updatedAt.toISOString(),
        tension: Number(tension.toFixed(3)),
        orderMutationLikelihood: t.orderId ? Number(Math.min(1, 0.35 + msgs / 120).toFixed(3)) : Number(Math.min(1, msgs / 200).toFixed(3)),
        pinnedProductId: t.productId,
        negotiationId: t.negotiationId,
        orderId: t.orderId,
        productLinked,
        negotiationLinked,
        pinnedProductLabel,
        latestStructuredMessages,
        cartConversionMessageCount,
        conversationalReservationSignals: conversationalReservationSignals.length ? conversationalReservationSignals : undefined,
      };
    });

    const commerceThroughMessagingIndex = Math.min(
      1,
      rows.reduce((s, r) => s + r.tension, 0) / Math.max(6, rows.length * 0.9),
    );

    return {
      generatedAt,
      organizationId,
      policy: "ACTIVE",
      threads: rows,
      commerceThroughMessagingIndex: Number(commerceThroughMessagingIndex.toFixed(3)),
      capabilities,
      moduleNote: "MessageThread + Message tails + ReservationIntent linkage — not a chat client.",
    };
  }
}
