import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { MessageType, Prisma, ThreadType } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";
import type { CommerceThreadResolvedActor } from "../commerce-thread-access/commerce-thread-actor-resolver.service";
import { CommerceThreadAccessPolicy } from "../commerce-thread-access/commerce-thread-access.policy";
import { RelationalNegotiationDraftService } from "../relational-negotiation/relational-negotiation-draft.service";

@Injectable()
export class CommerceMessagingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly relationalNegotiationDraft: RelationalNegotiationDraftService,
    private readonly threadAccess: CommerceThreadAccessPolicy,
  ) {}

  async startOrGetProductThread(
    actor: CommerceThreadResolvedActor,
    input: { productId: string; negotiationId: string },
  ) {
    const negotiationId = input.negotiationId?.trim();
    if (!negotiationId) {
      throw new BadRequestException({ code: "negotiation_id_required", detail: "Thread creation requires negotiationId (no org body-trust)." });
    }

    const neg = await this.prisma.negotiation.findUnique({
      where: { id: negotiationId },
      select: {
        id: true,
        productId: true,
        buyerOrganizationId: true,
        sellerOrganizationId: true,
      },
    });
    if (!neg) throw new NotFoundException(negotiationId);
    if (neg.productId !== input.productId) {
      throw new BadRequestException({ code: "negotiation_product_mismatch" });
    }

    if (actor.organizationId !== neg.buyerOrganizationId && actor.organizationId !== neg.sellerOrganizationId) {
      throw new ForbiddenException({ code: "venext_commerce_negotiation_actor_not_party" });
    }

    const rel = await this.threadAccess.findAcceptedRelationship(neg.buyerOrganizationId, neg.sellerOrganizationId);
    if (!rel) {
      throw new ForbiddenException({ code: "venext_commerce_relationship_required" });
    }

    const existing = await this.prisma.messageThread.findFirst({
      where: {
        productId: input.productId,
        buyerOrganizationId: neg.buyerOrganizationId,
        sellerOrganizationId: neg.sellerOrganizationId,
      },
    });
    if (existing) return existing;

    return this.prisma.messageThread.create({
      data: {
        threadType: ThreadType.NEGOTIATION_CONTEXT,
        productId: input.productId,
        buyerOrganizationId: neg.buyerOrganizationId,
        sellerOrganizationId: neg.sellerOrganizationId,
        negotiationId: neg.id,
      },
    });
  }

  async postMessage(
    actor: CommerceThreadResolvedActor,
    input: {
      threadId: string;
      messageType: MessageType;
      content?: string | null;
      structuredEvent?: Prisma.InputJsonValue;
      voiceUrl?: string | null;
      mediaUrls?: string[];
    },
  ) {
    const access = await this.threadAccess.assertCanWriteThread(actor, input.threadId);
    const msg = await this.prisma.message.create({
      data: {
        threadId: input.threadId,
        senderUserId: actor.userId,
        senderOrganizationId: actor.organizationId,
        messageType: input.messageType,
        content: input.content ?? null,
        structuredEvent: input.structuredEvent ?? Prisma.JsonNull,
        voiceUrl: input.voiceUrl ?? null,
        mediaUrls: input.mediaUrls ?? [],
      },
    });
    void this.relationalNegotiationDraft.processAfterInboundMessage(input.threadId, msg.id).catch(() => undefined);
    return { message: msg, access };
  }

  async commerceContext(actor: CommerceThreadResolvedActor, threadId: string) {
    const access = await this.threadAccess.assertCanReadThread(actor, threadId);
    const thread = await this.prisma.messageThread.findUnique({
      where: { id: threadId },
      include: {
        product: {
          include: {
            organization: { select: { id: true, displayName: true, commercialId: true } },
          },
        },
        order: {
          select: {
            id: true,
            status: true,
            paymentStatus: true,
            deliveryStatus: true,
            totalAmount: true,
            currency: true,
          },
        },
        negotiation: true,
        messages: { orderBy: { createdAt: "desc" }, take: 80 },
      },
    });
    if (!thread) throw new NotFoundException(threadId);
    return { ...thread, access };
  }

  async markThreadRead(actor: CommerceThreadResolvedActor, threadId: string) {
    const access = await this.threadAccess.assertCanWriteThread(actor, threadId);
    await this.prisma.message.updateMany({
      where: {
        threadId,
        NOT: { senderOrganizationId: actor.organizationId },
        readAt: null,
      },
      data: { readAt: new Date() },
    });
    return { threadId, readerOrganizationId: actor.organizationId, ok: true, access };
  }
}
