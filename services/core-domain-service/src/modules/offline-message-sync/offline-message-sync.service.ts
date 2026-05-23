import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { MessageDeliveryState } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";
import type { CommerceThreadResolvedActor } from "../commerce-thread-access/commerce-thread-actor-resolver.service";

/**
 * Pending outbound queue — durable + retry-friendly (Instruction 7 §10).
 */
@Injectable()
export class OfflineMessageSyncService {
  constructor(private readonly prisma: PrismaService) {}

  enqueue(threadId: string, payload: object) {
    return this.prisma.pendingOutboundMessage.create({
      data: {
        threadId,
        payload,
        deliveryState: MessageDeliveryState.SENDING,
      },
    });
  }

  listPendingForActor(actor: CommerceThreadResolvedActor) {
    return this.prisma.pendingOutboundMessage.findMany({
      where: {
        deliveryState: { in: [MessageDeliveryState.SENDING, MessageDeliveryState.FAILED] },
        thread: {
          OR: [{ buyerOrganizationId: actor.organizationId }, { sellerOrganizationId: actor.organizationId }],
        },
      },
      include: { thread: true },
      orderBy: { createdAt: "asc" },
      take: 200,
    });
  }

  async markSentForActor(id: string, actor: CommerceThreadResolvedActor) {
    const row = await this.prisma.pendingOutboundMessage.findUnique({
      where: { id },
      include: { thread: true },
    });
    if (!row) throw new NotFoundException(id);
    if (
      actor.organizationId !== row.thread.buyerOrganizationId &&
      actor.organizationId !== row.thread.sellerOrganizationId
    ) {
      throw new ForbiddenException({ code: "venext_commerce_offline_queue_access_denied" });
    }
    return this.prisma.pendingOutboundMessage.update({
      where: { id },
      data: { deliveryState: MessageDeliveryState.SENT, attemptCount: { increment: 1 } },
    });
  }
}
