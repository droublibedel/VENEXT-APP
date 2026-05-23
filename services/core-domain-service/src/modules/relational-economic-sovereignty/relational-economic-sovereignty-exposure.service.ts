import { Injectable } from "@nestjs/common";

import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class RelationalEconomicSovereigntyExposureService {
  constructor(private readonly prisma: PrismaService) {}

  async listSignals(relationshipId: string) {
    return this.prisma.relationalEconomicSovereigntySignal.findMany({
      where: { relationshipId },
      orderBy: { createdAt: "desc" },
      take: 24,
    });
  }
}
