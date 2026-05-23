/**
 * Instruction 20.20 — relational economic command center REST API.
 */
import {
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

import { CanonicalFeatureFlagEvaluator } from "../../feature-flags/canonical-feature-flag.evaluator";
import type { VenextHttpLike } from "../../platform-authz/venext-auth-context";
import { VenextAuthzGuard } from "../../platform-authz/venext-authz.guard";
import { VenextAuthz } from "../../platform-authz/venext-authz.decorators";
import type { CommerceThreadResolvedActor } from "../commerce-thread-access/commerce-thread-actor-resolver.service";
import { VENEXT_COMMERCE_THREAD_ACTOR_KEY } from "../commerce-thread-access/commerce-thread-participant.guard";
import { RelationalEconomicCommandCenterParticipantGuard } from "./relational-economic-command-center-participant.guard";
import { RelationalEconomicCommandCenterService } from "./relational-economic-command-center.service";

@Controller("relational-economic-command-center")
@UseGuards(VenextAuthzGuard, RelationalEconomicCommandCenterParticipantGuard)
export class RelationalEconomicCommandCenterController {
  constructor(
    private readonly flags: CanonicalFeatureFlagEvaluator,
    private readonly command: RelationalEconomicCommandCenterService,
  ) {}

  private async assertFlag(organizationId: string): Promise<void> {
    if (!(await this.flags.isEnabled("relational_economic_command_center_enabled", { organizationId }))) {
      throw new ForbiddenException({ code: "relational_economic_command_center_disabled" });
    }
  }

  @Get("overview")
  @VenextAuthz({ type: "orgQuery", queryKey: "organizationId" })
  async overview(@Query("organizationId") organizationId: string) {
    await this.assertFlag(organizationId);
    return this.command.getOverview(organizationId);
  }

  @Get("systemic-view")
  @VenextAuthz({ type: "orgQuery", queryKey: "organizationId" })
  async systemicView(
    @Query("organizationId") organizationId: string,
    @Query("relationshipId") relationshipId?: string,
  ) {
    await this.assertFlag(organizationId);
    return this.command.getSystemicView(organizationId, relationshipId);
  }

  @Get("snapshots")
  @VenextAuthz({ type: "orgQuery", queryKey: "organizationId" })
  async snapshots(
    @Query("organizationId") organizationId: string,
    @Query("relationshipId") relationshipId?: string,
  ) {
    await this.assertFlag(organizationId);
    return this.command.listSnapshots(organizationId, relationshipId);
  }

  @Get("snapshots/:id")
  @VenextAuthz({ type: "orgQuery", queryKey: "organizationId" })
  async snapshotById(@Param("id", ParseUUIDPipe) id: string, @Query("organizationId") organizationId: string) {
    await this.assertFlag(organizationId);
    return this.command.getSnapshotById(organizationId, id);
  }

  @Get("critical-corridors")
  @VenextAuthz({ type: "orgQuery", queryKey: "organizationId" })
  async critical(@Query("organizationId") organizationId: string) {
    await this.assertFlag(organizationId);
    return this.command.detectCriticalCorridors(organizationId);
  }

  @Get("cluster-pressure")
  @VenextAuthz({ type: "orgQuery", queryKey: "organizationId" })
  async clusters(
    @Query("organizationId") organizationId: string,
    @Query("relationshipId") relationshipId?: string,
  ) {
    await this.assertFlag(organizationId);
    return this.command.getClusterPressure(organizationId, relationshipId);
  }

  @Post("snapshots/:id/archive")
  @VenextAuthz({ type: "orgQuery", queryKey: "organizationId" })
  async archive(
    @Param("id", ParseUUIDPipe) id: string,
    @Query("organizationId") organizationId: string,
    @Body() body: unknown,
    @Req()
    req: VenextHttpLike & { [VENEXT_COMMERCE_THREAD_ACTOR_KEY]?: CommerceThreadResolvedActor },
  ) {
    await this.assertFlag(organizationId);
    const actor = req[VENEXT_COMMERCE_THREAD_ACTOR_KEY]!;
    return this.command.archiveSnapshot({
      id,
      body,
      actorOrganizationId: actor.organizationId,
      actorUserId: actor.userId,
      organizationId,
    });
  }
}
