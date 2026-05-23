import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class CatalogsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(organizationId?: string) {
    return this.prisma.catalog.findMany({
      where: organizationId ? { organizationId } : {},
      orderBy: { updatedAt: "desc" },
      take: 300,
    });
  }

  async findOne(id: string) {
    const row = await this.prisma.catalog.findUnique({ where: { id } });
    if (!row) throw new NotFoundException(id);
    return row;
  }
}
