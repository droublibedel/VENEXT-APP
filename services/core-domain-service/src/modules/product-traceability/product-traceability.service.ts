import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class ProductTraceabilityService {
  constructor(private readonly prisma: PrismaService) {}

  async getTraceability(productId: string) {
    const row = await this.prisma.productTraceability.findUnique({
      where: { productId },
    });
    if (!row) throw new NotFoundException(`traceability:${productId}`);
    return row;
  }

  listRecalls(productId: string) {
    return this.prisma.recallEvent.findMany({
      where: { productId },
      orderBy: { createdAt: "desc" },
      take: 50,
    });
  }
}
