import { Injectable } from "@nestjs/common";

import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class RelationalEconomicContinuityRiskService {
  constructor(private readonly prisma: PrismaService) {}

  async listCriticalCorridors(organizationId: string, limit = 24) {
    return this.prisma.relationalEconomicContinuityNode.findMany({
      where: {
        active: true,
        systemicContinuityRisk: { gte: 55 },
        relationship: {
          OR: [{ requesterOrganizationId: organizationId }, { receiverOrganizationId: organizationId }],
        },
      },
      orderBy: [{ systemicContinuityRisk: "desc" }, { instabilityScore: "desc" }],
      take: limit,
      select: {
        id: true,
        relationshipId: true,
        continuityNodeCode: true,
        continuityScore: true,
        instabilityScore: true,
        systemicContinuityRisk: true,
        recoveryProbability: true,
      },
    });
  }
}
