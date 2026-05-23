import { Injectable } from "@nestjs/common";
import { DeliveryStatus, OrderStatus } from "@prisma/client";
import type { Prisma } from "@prisma/client";
import type {
  RelationalOrderSignal,
  RelationalOrderStatus,
  RelationalSymbolicFulfillmentState,
} from "@venext/shared-contracts";

/**
 * Instruction 20.0 — pure mapping from Prisma order row → relational corridor status (no payment / logistics claims).
 * Exported for tuple-index construction used in Prisma `where` filters (status query + keyset pagination).
 */
export function computeRelationalOrderStatus(status: OrderStatus, delivery: DeliveryStatus): RelationalOrderStatus {
  if (status === OrderStatus.REJECTED) return "REJECTED";
  if (status === OrderStatus.CANCELLED) return "CANCELLED";
  if (status === OrderStatus.COMPLETED) return "COMPLETED";
  if (status === OrderStatus.DRAFT) return "DRAFT";
  if (status === OrderStatus.SUBMITTED) return "PENDING_CONFIRMATION";
  if (status === OrderStatus.ACCEPTED && delivery === DeliveryStatus.DELIVERED) return "DELIVERED";
  if (delivery === DeliveryStatus.OUT_FOR_DELIVERY) return "IN_TRANSIT";
  if (delivery === DeliveryStatus.PREPARING) return "PREPARING";
  if (status === OrderStatus.ACCEPTED && delivery === DeliveryStatus.NOT_STARTED) return "READY_FOR_DISPATCH";
  if (status === OrderStatus.ACCEPTED) return "CONFIRMED";
  if (status === OrderStatus.PARTIALLY_ACCEPTED) return "CONFIRMED";
  if (delivery === DeliveryStatus.FAILED) return "CANCELLED";
  return "NEGOTIATION";
}

const ALL_RELATIONAL_STATUSES: RelationalOrderStatus[] = [
  "DRAFT",
  "NEGOTIATION",
  "PENDING_CONFIRMATION",
  "CONFIRMED",
  "PREPARING",
  "READY_FOR_DISPATCH",
  "IN_TRANSIT",
  "DELIVERED",
  "COMPLETED",
  "CANCELLED",
  "REJECTED",
  "EXPIRED",
];

type StatusDeliveryPair = { status: OrderStatus; deliveryStatus: DeliveryStatus };

function buildRelationalOrderStatusTupleIndex(): Record<RelationalOrderStatus, StatusDeliveryPair[]> {
  const buckets = Object.fromEntries(ALL_RELATIONAL_STATUSES.map((k) => [k, [] as StatusDeliveryPair[]])) as Record<
    RelationalOrderStatus,
    StatusDeliveryPair[]
  >;
  for (const status of Object.values(OrderStatus)) {
    for (const deliveryStatus of Object.values(DeliveryStatus)) {
      const r = computeRelationalOrderStatus(status, deliveryStatus);
      buckets[r]!.push({ status, deliveryStatus });
    }
  }
  return buckets;
}

/** Every Prisma (OrderStatus × DeliveryStatus) pair indexed by its relational snapshot label. */
export const RELATIONAL_ORDER_STATUS_PRISMA_TUPLES: Record<RelationalOrderStatus, StatusDeliveryPair[]> =
  buildRelationalOrderStatusTupleIndex();

/**
 * Prisma `where` fragment: orders whose (status, deliveryStatus) maps to the given relational label.
 * `EXPIRED` has no Prisma mapping yet → empty result set shape.
 */
export function prismaWhereForRelationalOrderStatus(status: RelationalOrderStatus): Prisma.OrderWhereInput {
  const pairs = RELATIONAL_ORDER_STATUS_PRISMA_TUPLES[status] ?? [];
  if (pairs.length === 0) {
    return { id: { in: [] } };
  }
  return { OR: pairs.map((p) => ({ status: p.status, deliveryStatus: p.deliveryStatus })) };
}

/**
 * Instruction 20.0 — symbolic order / fulfillment projection (no logistics realtime, no payment).
 */
@Injectable()
export class RelationalOrdersStateService {
  mapSymbolicFulfillment(delivery: DeliveryStatus): RelationalSymbolicFulfillmentState {
    switch (delivery) {
      case DeliveryStatus.NOT_STARTED:
        return "NOT_STARTED";
      case DeliveryStatus.PREPARING:
        return "PREPARING";
      case DeliveryStatus.OUT_FOR_DELIVERY:
        return "IN_MOTION";
      case DeliveryStatus.DELIVERED:
        return "DELIVERED_SYMBOLIC";
      case DeliveryStatus.FAILED:
        return "FAILED_SYMBOLIC";
      default:
        return "UNKNOWN";
    }
  }

  mapRelationalOrderStatus(status: OrderStatus, delivery: DeliveryStatus): RelationalOrderStatus {
    return computeRelationalOrderStatus(status, delivery);
  }

  buildHeuristicSignals(args: {
    orderStatus: RelationalOrderStatus;
    itemCount: number;
    symbolicFulfillment: RelationalSymbolicFulfillmentState;
  }): RelationalOrderSignal[] {
    const out: RelationalOrderSignal[] = [];
    const base = {
      heuristicOnly: true as const,
      advisoryOnly: true as const,
      symbolicExecution: true as const,
    };
    if (args.itemCount > 12) {
      out.push({
        signalId: `ro-sig-vol-${args.itemCount}`,
        signalType: "RELATIONAL_VOLUME_SHIFT",
        severity: "low",
        confidence: 0.42,
        confidenceExplanation: "confidence=0.42 lorsque le nombre de lignes dépasse 12 (proxy de densité relationnelle).",
        ...base,
        explanation:
          "Volume de lignes élevé sur une commande corridor — lecture symbolique, pas prévision de demande ni optimisation.",
        sourceSignals: [`lineCount=${args.itemCount}`],
      });
    }
    if (args.symbolicFulfillment === "PREPARING" || args.symbolicFulfillment === "IN_MOTION") {
      out.push({
        signalId: "ro-sig-delay",
        signalType: "DELIVERY_DELAY_RISK",
        severity: "low",
        confidence: 0.48,
        confidenceExplanation: "confidence=0.48 lorsque fulfillment symbolique est PREPARING ou IN_MOTION.",
        ...base,
        explanation:
          "État logistique symbolique Prisma — pas de suivi temps réel, pas d’engagement de date de livraison.",
        sourceSignals: [`symbolicFulfillment=${args.symbolicFulfillment}`],
      });
    }
    if (args.orderStatus === "PENDING_CONFIRMATION" || args.orderStatus === "NEGOTIATION") {
      out.push({
        signalId: "ro-sig-dormant",
        signalType: "DORMANT_RELATION_ORDER_SIGNAL",
        severity: "info",
        confidence: 0.44,
        confidenceExplanation: "confidence=0.44 lorsque statut relationnel est négociation ou attente de confirmation.",
        ...base,
        explanation: "Commande en attente symbolique — rappel de cadence relationnelle, pas alerte commerciale certifiée.",
        sourceSignals: [`orderStatus=${args.orderStatus}`],
      });
    }
    return out.slice(0, 8);
  }
}
