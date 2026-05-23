import { Injectable, NotFoundException } from "@nestjs/common";
import { GroupBuyingStatus } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class GroupBuyingService {
  constructor(private readonly prisma: PrismaService) {}

  listSessions(filters?: { relationshipId?: string; status?: GroupBuyingStatus }) {
    return this.prisma.groupBuyingSession.findMany({
      where: {
        relationshipId: filters?.relationshipId,
        status: filters?.status,
      },
      include: {
        product: {
          select: { id: true, name: true, category: true, unitLabel: true, currency: true },
        },
        initiator: { select: { id: true, displayName: true } },
      },
      orderBy: { expiresAt: "asc" },
      take: 200,
    });
  }

  async getSession(id: string) {
    const row = await this.prisma.groupBuyingSession.findUnique({
      where: { id },
      include: {
        product: true,
        initiator: { select: { id: true, displayName: true, commercialId: true } },
        relationship: { select: { id: true, status: true } },
      },
    });
    if (!row) throw new NotFoundException(id);
    return row;
  }
}
