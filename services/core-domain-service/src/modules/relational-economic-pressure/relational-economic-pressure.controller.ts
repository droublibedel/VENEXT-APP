/**
 * Instruction 20.21 — REST API for economic pressure & dependency mapping.
 */
import {
  BadRequestException,
  Body,
  Controller,
  ForbiddenException,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  Req,
  UseGuards,
} from "@nestjs/common";
import {
  PressureActionResponseSchema,
  PressureArchiveRequestSchema,
} from "@venext/shared-contracts";

import { CanonicalFeatureFlagEvaluator } from "../../feature-flags/canonical-feature-flag.evaluator";
import type { VenextHttpLike } from "../../platform-authz/venext-auth-context";
import { VenextAuthzGuard } from "../../platform-authz/venext-authz.guard";
import { VenextAuthz } from "../../platform-authz/venext-authz.decorators";
import type { CommerceThreadResolvedActor } from "../commerce-thread-access/commerce-thread-actor-resolver.service";
import { VENEXT_COMMERCE_THREAD_ACTOR_KEY } from "../commerce-thread-access/commerce-thread-participant.guard";
import { RelationalEconomicPressureGuard } from "./relational-economic-pressure.guard";
import { RelationalEconomicPressureService } from "./relational-economic-pressure.service";

@Controller("relational-economic-pressure")
@UseGuards(VenextAuthzGuard, RelationalEconomicPressureGuard)
export class RelationalEconomicPressureController {
  constructor(
    private readonly flags: CanonicalFeatureFlagEvaluator,
    private readonly pressure: RelationalEconomicPressureService,
  ) {}

  private async assertFlag(organizationId: string): Promise<void> {
    if (!(await this.flags.isEnabled("relational_economic_pressure_enabled", { organizationId }))) {
      throw new ForbiddenException({ code: "relational_economic_pressure_disabled" });
    }
  }

  @Get("critical-corridors")
  @VenextAuthz({ type: "orgQuery", queryKey: "organizationId" })
  async criticalCorridors(@Query("organizationId") organizationId: string) {
    await this.assertFlag(organizationId);
    return this.pressure.getCriticalCorridors(organizationId);
  }

  @Get("fragility-zones")
  @VenextAuthz({ type: "orgQuery", queryKey: "organizationId" })
  async fragilityZones(@Query("organizationId") organizationId: string) {
    await this.assertFlag(organizationId);
    return this.pressure.getFragilityZones(organizationId);
  }

  @Get("pressure-overview/:relationshipId")
  @VenextAuthz({ type: "orgQuery", queryKey: "organizationId" })
  async pressureOverview(
    @Param("relationshipId", ParseUUIDPipe) relationshipId: string,
    @Query("organizationId") organizationId: string,
  ) {
    await this.assertFlag(organizationId);
    return this.pressure.computePressureOverview(organizationId, relationshipId);
  }

  @Get("dependency-map/:relationshipId")
  @VenextAuthz({ type: "orgQuery", queryKey: "organizationId" })
  async dependencyMap(
    @Param("relationshipId", ParseUUIDPipe) relationshipId: string,
    @Query("organizationId") organizationId: string,
  ) {
    await this.assertFlag(organizationId);
    return this.pressure.getDependencyMap(organizationId, relationshipId);
  }

  @Get("propagation-map/:relationshipId")
  @VenextAuthz({ type: "orgQuery", queryKey: "organizationId" })
  async propagationMap(
    @Param("relationshipId", ParseUUIDPipe) relationshipId: string,
    @Query("organizationId") organizationId: string,
  ) {
    await this.assertFlag(organizationId);
    return this.pressure.getPropagationMap(organizationId, relationshipId);
  }

  @Post("archive-dependency/:id")
  @VenextAuthz({ type: "orgQuery", queryKey: "organizationId" })
  async archiveDependency(
    @Param("id", ParseUUIDPipe) id: string,
    @Query("organizationId") organizationId: string,
    @Body() body: unknown,
    @Req()
    req: VenextHttpLike & { [VENEXT_COMMERCE_THREAD_ACTOR_KEY]?: CommerceThreadResolvedActor },
  ) {
    await this.assertFlag(organizationId);
    const parsed = PressureArchiveRequestSchema.safeParse(body ?? {});
    if (!parsed.success) {
      throw new BadRequestException({ code: "relational_economic_pressure_archive_invalid" });
    }
    const actor = req[VENEXT_COMMERCE_THREAD_ACTOR_KEY]!;
    const edge = await this.pressure.archiveDependencyEdge({
      organizationId,
      edgeId: id,
      actorOrganizationId: actor.organizationId,
      actorUserId: actor.userId,
      archiveReason: parsed.data.archiveReason,
    });
    const res = PressureActionResponseSchema.safeParse({
      edge,
      paymentExecutionDisabled: true,
      publicTrackingDisabled: true,
    });
    if (!res.success) {
      throw new BadRequestException({ code: "relational_economic_pressure_archive_response_invalid" });
    }
    return res.data;
  }
}
