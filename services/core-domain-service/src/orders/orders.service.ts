import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class OrdersService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(filters?: { buyerOrganizationId?: string; sellerOrganizationId?: string }) {
    return this.prisma.order.findMany({
      where: {
        buyerOrganizationId: filters?.buyerOrganizationId,
        sellerOrganizationId: filters?.sellerOrganizationId,
      },
      include: {
        items: true,
      },
      orderBy: { createdAt: "desc" },
      take: 200,
    });
  }

  async findOne(id: string) {
    const row = await this.prisma.order.findUnique({
      where: { id },
      include: { items: true },
    });
    if (!row) throw new NotFoundException(id);
    return row;
  }
}
