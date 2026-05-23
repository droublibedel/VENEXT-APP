import { Injectable } from "@nestjs/common";
import type { GroupBuyingSessionRow, GroupBuyingSupervisionResponse } from "@venext/shared-contracts";
import { GroupBuyingStatus } from "@prisma/client";
import type { OrderAdvRawSnapshot } from "../order-adv-intelligence/order-adv-data.service";

@Injectable()
export class GroupBuyingSupervisionService {
  build(snapshot: OrderAdvRawSnapshot, enabled: boolean): GroupBuyingSupervisionResponse {
    const { organizationId, generatedAt, groupSessions } = snapshot;
    if (!enabled) {
      return {
        generatedAt,
        organizationId,
        policy: "DISABLED",
        activeSessions: 0,
        rows: [],
        dataSource: "GroupBuyingSession_prisma",
      };
    }

    const rows: GroupBuyingSessionRow[] = groupSessions.map((g) => {
      const tgt = Number(g.targetQuantity);
      const cur = Number(g.currentQuantity);
      const thresholdProgress = tgt > 0 ? Math.min(1, cur / tgt) : 0;
      const hoursLeft = (g.expiresAt.getTime() - Date.now()) / 3600000;
      let velocityHint: GroupBuyingSessionRow["velocityHint"] = "steady";
      if (thresholdProgress < 0.15 && hoursLeft < 36) velocityHint = "stalled";
      if (thresholdProgress > 0.78 || g.participantCount > 6) velocityHint = "surge";
      const pressure = Math.min(1, (1 - thresholdProgress) * 0.55 + g.participantCount / 14);
      return {
        sessionId: g.id,
        productId: g.productId,
        productName: g.product.name,
        status: g.status,
        thresholdProgress: Number(thresholdProgress.toFixed(3)),
        participantCount: g.participantCount,
        expiresAt: g.expiresAt.toISOString(),
        pressure: Number(pressure.toFixed(3)),
        velocityHint,
      };
    });

    const activeSessions = groupSessions.filter((g) => g.status === GroupBuyingStatus.OPEN).length;

    return {
      generatedAt,
      organizationId,
      policy: "ACTIVE",
      activeSessions,
      rows: rows.slice(0, 40),
      dataSource: "GroupBuyingSession_prisma",
    };
  }
}
