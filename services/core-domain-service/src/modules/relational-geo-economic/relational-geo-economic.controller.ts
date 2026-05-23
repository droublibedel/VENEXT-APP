/**
 * Instruction 20.22 — REST API for relational geo-economic territorial intelligence.
 */
import {
  BadRequestException,
  Body,
  Controller,
  ForbiddenException,
  Get,
  NotFoundException,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  Req,
  UseGuards,
} from "@nestjs/common";
import type { Prisma } from "@prisma/client";
import {
  GeoEconomicActionResponseSchema,
  GeoEconomicArchiveZoneRequestSchema,
  GeoEconomicCriticalZonesSchema,
  GeoEconomicExpansionOverviewSchema,
  GeoEconomicPressureSchema,
  GeoEconomicPropagationSchema,
  GeoEconomicZoneSchema,
} from "@venext/shared-contracts";

import { CanonicalFeatureFlagEvaluator } from "../../feature-flags/canonical-feature-flag.evaluator";
import { PrismaService } from "../../prisma/prisma.service";
import type { VenextHttpLike } from "../../platform-authz/venext-auth-context";
import { VenextAuthzGuard } from "../../platform-authz/venext-authz.guard";
import { VenextAuthz } from "../../platform-authz/venext-authz.decorators";
import type { CommerceThreadResolvedActor } from "../commerce-thread-access/commerce-thread-actor-resolver.service";
import { VENEXT_COMMERCE_THREAD_ACTOR_KEY } from "../commerce-thread-access/commerce-thread-participant.guard";
import { RelationshipGovernancePolicyService } from "../relationship-governance/relationship-governance-policy.service";
import { RelationalGeoEconomicPolicyService } from "./relational-geo-economic-policy.service";
import { RelationalGeoEconomicPressureService } from "./relational-geo-economic-pressure.service";
import { RelationalGeoEconomicPropagationService } from "./relational-geo-economic-propagation.service";
import { RelationalGeoEconomicGuard } from "./relational-geo-economic.guard";
import { RelationalGeoEconomicZoneService } from "./relational-geo-economic-zone.service";

@Controller("relational-geo-economic")
@UseGuards(VenextAuthzGuard, RelationalGeoEconomicGuard)
export class RelationalGeoEconomicController {
  constructor(
    private readonly flags: CanonicalFeatureFlagEvaluator,
    private readonly prisma: PrismaService,
    private readonly governance: RelationshipGovernancePolicyService,
    private readonly policy: RelationalGeoEconomicPolicyService,
    private readonly zones: RelationalGeoEconomicZoneService,
    private readonly pressure: RelationalGeoEconomicPressureService,
    private readonly propagation: RelationalGeoEconomicPropagationService,
  ) {}

  private async assertFlag(organizationId: string): Promise<void> {
    if (!(await this.flags.isEnabled("relational_geo_economic_enabled", { organizationId }))) {
      throw new ForbiddenException({ code: "relational_geo_economic_disabled" });
    }
  }

  private async assertOrgOnRelationship(organizationId: string, relationshipId: string): Promise<void> {
    const rel = await this.prisma.relationship.findFirst({
      where: {
        id: relationshipId,
        OR: [{ requesterOrganizationId: organizationId }, { receiverOrganizationId: organizationId }],
      },
      select: { id: true },
    });
    if (!rel) throw new NotFoundException({ code: "relational_geo_economic_relationship_not_found" });
  }

  @Get("zones")
  @VenextAuthz({ type: "orgQuery", queryKey: "organizationId" })
  async listZones(@Query("organizationId") organizationId: string) {
    await this.assertFlag(organizationId);
    const rows = await this.zones.listZonesForOrganization(organizationId);
    const items = rows.map((z) => this.zones.zoneToWire(z));
    for (const it of items) {
      const p = GeoEconomicZoneSchema.safeParse(it);
      if (!p.success) throw new BadRequestException({ code: "relational_geo_economic_zone_wire_invalid" });
    }
    return { zones: items };
  }

  @Get("zones/:id")
  @VenextAuthz({ type: "orgQuery", queryKey: "organizationId" })
  async getZone(@Param("id", ParseUUIDPipe) id: string, @Query("organizationId") organizationId: string) {
    await this.assertFlag(organizationId);
    const z = await this.zones.getZoneForOrganization(organizationId, id);
    const wire = this.zones.zoneToWire(z);
    const p = GeoEconomicZoneSchema.safeParse(wire);
    if (!p.success) throw new BadRequestException({ code: "relational_geo_economic_zone_wire_invalid" });
    return p.data;
  }

  @Get("pressure-map")
  @VenextAuthz({ type: "orgQuery", queryKey: "organizationId" })
  async pressureMap(@Query("organizationId") organizationId: string) {
    await this.assertFlag(organizationId);
    const rows = await this.zones.listZonesForOrganization(organizationId);
    const det = this.pressure.detectPressureZones(rows);
    const regionalSaturationScore = this.policy.clampInt(
      det.congestedZoneCodes.length * 12 + det.corridorConcentrationCodes.length * 9,
    );
    const operationalSaturationScore = this.policy.clampInt(
      det.diagnostics.filter((d) => d.startsWith("operational_saturation")).length * 18 + 10,
    );
    const raw = {
      organizationId,
      pressureLevel: det.pressureLevel,
      congestedZoneCodes: det.congestedZoneCodes,
      corridorConcentrationCodes: det.corridorConcentrationCodes,
      regionalSaturationScore,
      operationalSaturationScore,
      propagationPressureCodes: det.propagationPressureCodes,
      diagnostics: det.diagnostics,
      computedAt: new Date().toISOString(),
      paymentExecutionDisabled: true as const,
      publicTrackingDisabled: true as const,
    };
    const p = GeoEconomicPressureSchema.safeParse(raw);
    if (!p.success) throw new BadRequestException({ code: "relational_geo_economic_pressure_map_invalid" });
    return p.data;
  }

  @Get("propagation-map/:relationshipId")
  @VenextAuthz({ type: "orgQuery", queryKey: "organizationId" })
  async propagationMap(
    @Param("relationshipId", ParseUUIDPipe) relationshipId: string,
    @Query("organizationId") organizationId: string,
  ) {
    await this.assertFlag(organizationId);
    await this.assertOrgOnRelationship(organizationId, relationshipId);
    await this.governance.assertCorridorOperational(relationshipId, "operational_observation");
    const { cascadePaths, maxDepthObserved } = await this.propagation.projectRegionalPropagation(relationshipId);
    const zoneRows = await this.zones.listZonesForOrganization(organizationId);
    const exposureByZoneCode = zoneRows.slice(0, 60).map((z) => ({
      zoneCode: z.zoneCode,
      exposureScore: this.policy.clampInt(z.systemicExposureScore + z.corridorCount),
    }));
    const raw = {
      relationshipId,
      maxDepthObserved,
      cascadePaths: cascadePaths.slice(0, 48),
      exposureByZoneCode,
      computedAt: new Date().toISOString(),
      paymentExecutionDisabled: true as const,
      publicTrackingDisabled: true as const,
    };
    const p = GeoEconomicPropagationSchema.safeParse(raw);
    if (!p.success) throw new BadRequestException({ code: "relational_geo_economic_propagation_map_invalid" });
    return p.data;
  }

  @Get("expansion-overview")
  @VenextAuthz({ type: "orgQuery", queryKey: "organizationId" })
  async expansionOverview(@Query("organizationId") organizationId: string) {
    await this.assertFlag(organizationId);
    const rows = await this.zones.listZonesForOrganization(organizationId);
    const sorted = [...rows].sort((a, b) => b.expansionPotentialScore - a.expansionPotentialScore).slice(0, 24);
    const raw = {
      organizationId,
      rankedZones: sorted.map((z) => this.zones.zoneToWire(z)),
      narrative:
        "Projection territoriale analytique — lecture systémique des bassins et corridors, sans automatisation commerciale.",
      computedAt: new Date().toISOString(),
      paymentExecutionDisabled: true as const,
      publicTrackingDisabled: true as const,
    };
    const p = GeoEconomicExpansionOverviewSchema.safeParse(raw);
    if (!p.success) throw new BadRequestException({ code: "relational_geo_economic_expansion_overview_invalid" });
    return p.data;
  }

  @Get("critical-zones")
  @VenextAuthz({ type: "orgQuery", queryKey: "organizationId" })
  async criticalZones(@Query("organizationId") organizationId: string) {
    await this.assertFlag(organizationId);
    const rows = await this.zones.listZonesForOrganization(organizationId);
    const critical = rows.filter((z) => z.economicPressureScore >= 75 || z.fragilityScore >= 70).slice(0, 40);
    const raw = {
      organizationId,
      zones: critical.map((z) => this.zones.zoneToWire(z)),
      computedAt: new Date().toISOString(),
      paymentExecutionDisabled: true as const,
      publicTrackingDisabled: true as const,
    };
    const p = GeoEconomicCriticalZonesSchema.safeParse(raw);
    if (!p.success) throw new BadRequestException({ code: "relational_geo_economic_critical_zones_invalid" });
    return p.data;
  }

  @Post("archive-zone/:id")
  @VenextAuthz({ type: "orgQuery", queryKey: "organizationId" })
  async archiveZone(
    @Param("id", ParseUUIDPipe) id: string,
    @Query("organizationId") organizationId: string,
    @Body() body: unknown,
    @Req()
    req: VenextHttpLike & { [VENEXT_COMMERCE_THREAD_ACTOR_KEY]?: CommerceThreadResolvedActor },
  ) {
    await this.assertFlag(organizationId);
    const parsed = GeoEconomicArchiveZoneRequestSchema.safeParse(body ?? {});
    if (!parsed.success) {
      throw new BadRequestException({ code: "relational_geo_economic_archive_invalid" });
    }
    const actor = req[VENEXT_COMMERCE_THREAD_ACTOR_KEY]!;

    const link = await this.prisma.relationalGeoEconomicZoneCorridor.findFirst({
      where: {
        zoneId: id,
        relationship: {
          OR: [{ requesterOrganizationId: organizationId }, { receiverOrganizationId: organizationId }],
        },
      },
      include: { relationship: { select: { id: true, corridorState: true } } },
      orderBy: { createdAt: "desc" },
    });
    if (!link) throw new NotFoundException({ code: "relational_geo_economic_zone_corridor_not_found" });

    await this.governance.assertCorridorOperational(link.relationshipId, "operational_observation");
    if (!this.policy.canMutateGeoEconomicState(link.relationship.corridorState)) {
      throw new ForbiddenException({ code: "relational_geo_economic_corridor_readonly" });
    }

    await this.zones.assertZoneMutableForArchive(organizationId, id);

    await this.prisma.relationalGeoEconomicEvent.create({
      data: {
        relationshipId: link.relationshipId,
        zoneId: id,
        eventType: "ZONE_ARCHIVED",
        actorOrganizationId: actor.organizationId,
        actorUserId: actor.userId,
        diagnostics: { reason: parsed.data.archiveReason } as Prisma.InputJsonValue,
      },
    });

    const updated = await this.zones.applyArchiveMetadata(id, parsed.data.archiveReason);
    const wire = this.zones.zoneToWire(updated);
    const res = GeoEconomicActionResponseSchema.safeParse({
      zone: wire,
      paymentExecutionDisabled: true,
      publicTrackingDisabled: true,
    });
    if (!res.success) {
      throw new BadRequestException({ code: "relational_geo_economic_archive_response_invalid" });
    }
    return res.data;
  }
}
