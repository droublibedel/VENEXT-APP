import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class MessagesService {
  constructor(private readonly prisma: PrismaService) {}

  threads(filters?: {
    productId?: string;
    orderId?: string;
    negotiationId?: string;
    organizationId?: string;
  }) {
    return this.prisma.messageThread.findMany({
      where: {
        productId: filters?.productId,
        orderId: filters?.orderId,
        negotiationId: filters?.negotiationId,
        OR: filters?.organizationId
          ? [
              { buyerOrganizationId: filters.organizationId },
              { sellerOrganizationId: filters.organizationId },
            ]
          : undefined,
      },
      orderBy: { updatedAt: "desc" },
      take: 100,
    });
  }

  async threadMessages(threadId: string) {
    const thread = await this.prisma.messageThread.findUnique({
      where: { id: threadId },
    });
    if (!thread) throw new NotFoundException(threadId);
    return this.prisma.message.findMany({
      where: { threadId },
      orderBy: { createdAt: "asc" },
      take: 500,
    });
  }
}
