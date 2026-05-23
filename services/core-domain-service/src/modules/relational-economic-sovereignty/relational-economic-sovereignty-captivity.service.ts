import { Injectable } from "@nestjs/common";

import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class RelationalEconomicSovereigntyCaptivityService {
  constructor(private readonly prisma: PrismaService) {}

  async listCriticalCorridors(organizationId: string, limit = 24) {
    return this.prisma.relationalEconomicSovereigntyNode.findMany({
      where: {
        active: true,
        strategicCaptivityRisk: { gte: 55 },
        relationship: {
          OR: [{ requesterOrganizationId: organizationId }, { receiverOrganizationId: organizationId }],
        },
      },
      orderBy: [{ strategicCaptivityRisk: "desc" }, { dependencyExposureScore: "desc" }],
      take: limit,
      select: {
        id: true,
        relationshipId: true,
        sovereigntyNodeCode: true,
        strategicCaptivityRisk: true,
        autonomyScore: true,
        sovereigntyScore: true,
      },
    });
  }
}
