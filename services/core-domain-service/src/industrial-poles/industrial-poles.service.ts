import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class IndustrialPolesService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(organizationId?: string) {
    return this.prisma.industrialPoleConfig.findMany({
      where: organizationId ? { organizationId } : {},
      orderBy: { updatedAt: "desc" },
      take: 100,
    });
  }

  async findOne(id: string) {
    const row = await this.prisma.industrialPoleConfig.findUnique({
      where: { id },
    });
    if (!row) throw new NotFoundException(id);
    return row;
  }
}
