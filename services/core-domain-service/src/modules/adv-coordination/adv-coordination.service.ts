import { Injectable } from "@nestjs/common";
import type { AdvCoordinationResponse, AdvCoordinationQueueItem } from "@venext/shared-contracts";
import { OrderStatus, PaymentStatus } from "@prisma/client";
import type { OrderAdvRawSnapshot } from "../order-adv-intelligence/order-adv-data.service";

@Injectable()
export class AdvCoordinationService {
  build(snapshot: OrderAdvRawSnapshot, enabled: boolean): AdvCoordinationResponse {
    const { organizationId, generatedAt, orders } = snapshot;
    if (!enabled) {
      return {
        generatedAt,
        organizationId,
        policy: "DISABLED",
        validationQueueDepth: 0,
        pendingConfirmations: 0,
        invoiceReadiness: 0,
        items: [],
      };
    }

    const pending = orders.filter((o) => {
      if (o.paymentStatus !== PaymentStatus.UNPAID) return false;
      return (
        o.status === OrderStatus.SUBMITTED ||
        o.status === OrderStatus.ACCEPTED ||
        o.status === OrderStatus.PARTIALLY_ACCEPTED
      );
    });
    const draftAdv = orders.filter((o) => o.status === OrderStatus.DRAFT);

    const items: AdvCoordinationQueueItem[] = pending.slice(0, 20).map((o) => ({
      id: `adv-${o.id}`,
      kind: "payment_confirmation",
      label: `Order ${o.id.slice(0, 8)} — ${o.status}`,
      state: o.paymentStatus,
      tension: Number(Math.min(1, 0.35 + (Date.now() - o.updatedAt.getTime()) / (120 * 3600000)).toFixed(3)),
    }));

    for (const o of draftAdv.slice(0, 8)) {
      items.push({
        id: `adv-draft-${o.id}`,
        kind: "validation_queue",
        label: `Draft execution ${o.id.slice(0, 8)}`,
        state: o.status,
        tension: 0.42,
      });
    }

    const invoiceReadiness = Math.min(
      1,
      orders.filter((o) => o.paymentStatus === PaymentStatus.PAID).length / Math.max(6, orders.length),
    );

    return {
      generatedAt,
      organizationId,
      policy: "ACTIVE",
      validationQueueDepth: draftAdv.length,
      pendingConfirmations: pending.length,
      invoiceReadiness: Number(invoiceReadiness.toFixed(3)),
      items,
    };
  }
}
