import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class WalletsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(organizationId?: string) {
    return this.prisma.wallet.findMany({
      where: organizationId ? { organizationId } : {},
      orderBy: { updatedAt: "desc" },
      take: 100,
    });
  }

  async findOne(id: string) {
    const row = await this.prisma.wallet.findUnique({ where: { id } });
    if (!row) throw new NotFoundException(id);
    return row;
  }

  transactionsForWallet(walletId: string) {
    return this.prisma.transaction.findMany({
      where: { walletId },
      orderBy: { createdAt: "desc" },
      take: 200,
    });
  }
}
