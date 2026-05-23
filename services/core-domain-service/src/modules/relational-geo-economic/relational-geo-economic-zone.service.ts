import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import type { Prisma, RelationalGeoEconomicZone } from "@prisma/client";

import { PrismaService } from "../../prisma/prisma.service";

/**
 * Instruction 20.22 — zone persistence and org-scoped reads.
 */
@Injectable()
export class RelationalGeoEconomicZoneService {
  constructor(private readonly prisma: PrismaService) {}

  zoneToWire(z: RelationalGeoEconomicZone) {
    return {
      id: z.id,
      zoneCode: z.zoneCode,
      zoneName: z.zoneName,
      zoneType: z.zoneType,
      countryCode: z.countryCode,
      regionCode: z.regionCode,
      operationalDensityScore: z.operationalDensityScore,
      economicPressureScore: z.economicPressureScore,
      systemicExposureScore: z.systemicExposureScore,
      expansionPotentialScore: z.expansionPotentialScore,
      fragilityScore: z.fragilityScore,
      corridorCount: z.corridorCount,
      activeClusterCount: z.activeClusterCount,
      createdAt: z.createdAt.toISOString(),
      updatedAt: z.updatedAt.toISOString(),
      paymentExecutionDisabled: true as const,
      publicTrackingDisabled: true as const,
    };
  }

  async listZonesForOrganization(organizationId: string): Promise<RelationalGeoEconomicZone[]> {
    return this.prisma.relationalGeoEconomicZone.findMany({
      where: {
        zoneCorridors: {
          some: {
            relationship: {
              OR: [{ requesterOrganizationId: organizationId }, { receiverOrganizationId: organizationId }],
            },
          },
        },
      },
      orderBy: { economicPressureScore: "desc" },
      take: 80,
    });
  }

  async getZoneForOrganization(organizationId: string, zoneId: string): Promise<RelationalGeoEconomicZone> {
    const z = await this.prisma.relationalGeoEconomicZone.findFirst({
      where: {
        id: zoneId,
        zoneCorridors: {
          some: {
            relationship: {
              OR: [{ requesterOrganizationId: organizationId }, { receiverOrganizationId: organizationId }],
            },
          },
        },
      },
    });
    if (!z) throw new NotFoundException({ code: "relational_geo_economic_zone_not_found" });
    return z;
  }

  async assertZoneMutableForArchive(organizationId: string, zoneId: string): Promise<RelationalGeoEconomicZone> {
    const z = await this.getZoneForOrganization(organizationId, zoneId);
    const meta = (z.metadata as Record<string, unknown> | null) ?? {};
    if (meta.archived === true) {
      throw new ForbiddenException({ code: "relational_geo_economic_zone_already_archived" });
    }
    return z;
  }

  async applyArchiveMetadata(zoneId: string, reason: string): Promise<RelationalGeoEconomicZone> {
    const existing = await this.prisma.relationalGeoEconomicZone.findUnique({ where: { id: zoneId } });
    if (!existing) throw new NotFoundException(zoneId);
    const prev = (existing.metadata as Record<string, unknown> | null) ?? {};
    const metadata: Prisma.InputJsonValue = {
      ...prev,
      archived: true,
      archivedAt: new Date().toISOString(),
      archiveReason: reason.slice(0, 4000),
    };
    return this.prisma.relationalGeoEconomicZone.update({
      where: { id: zoneId },
      data: { metadata },
    });
  }
}
