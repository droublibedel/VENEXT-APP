import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class NegotiationsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(filters?: {
    productId?: string;
    buyerOrganizationId?: string;
    sellerOrganizationId?: string;
  }) {
    return this.prisma.negotiation.findMany({
      where: {
        productId: filters?.productId,
        buyerOrganizationId: filters?.buyerOrganizationId,
        sellerOrganizationId: filters?.sellerOrganizationId,
      },
      orderBy: { updatedAt: "desc" },
      take: 200,
    });
  }

  async findOne(id: string) {
    const row = await this.prisma.negotiation.findUnique({ where: { id } });
    if (!row) throw new NotFoundException(id);
    return row;
  }
}
