/**
 * Instruction 20.19 — relational economic signal graph API.
 */
import { Body, Controller, ForbiddenException, Get, Param, ParseUUIDPipe, Post, Query, Req, UseGuards } from "@nestjs/common";

import { CanonicalFeatureFlagEvaluator } from "../../feature-flags/canonical-feature-flag.evaluator";
import type { VenextHttpLike } from "../../platform-authz/venext-auth-context";
import { VenextAuthzGuard } from "../../platform-authz/venext-authz.guard";
import { VenextAuthz } from "../../platform-authz/venext-authz.decorators";
import type { CommerceThreadResolvedActor } from "../commerce-thread-access/commerce-thread-actor-resolver.service";
import { VENEXT_COMMERCE_THREAD_ACTOR_KEY } from "../commerce-thread-access/commerce-thread-participant.guard";
import { RelationalEconomicSignalParticipantGuard } from "./relational-economic-signal-participant.guard";
import { RelationalEconomicSignalGraphService } from "./relational-economic-signal-graph.service";

@Controller("relational-economic-signal-graph")
@UseGuards(VenextAuthzGuard, RelationalEconomicSignalParticipantGuard)
export class RelationalEconomicSignalGraphController {
  constructor(
    private readonly flags: CanonicalFeatureFlagEvaluator,
    private readonly graph: RelationalEconomicSignalGraphService,
  ) {}

  private async assertFlag(organizationId: string): Promise<void> {
    if (!(await this.flags.isEnabled("relational_economic_signal_graph_enabled", { organizationId }))) {
      throw new ForbiddenException({ code: "relational_economic_signal_graph_disabled" });
    }
  }

  @Get("signals")
  @VenextAuthz({ type: "orgQuery", queryKey: "organizationId" })
  async list(
    @Query("organizationId") organizationId: string,
    @Query("relationshipId") relationshipId: string | undefined,
  ) {
    await this.assertFlag(organizationId);
    return this.graph.listSignals({ relationshipId: relationshipId?.trim() || undefined });
  }

  @Get("graph-overview/:relationshipId")
  @VenextAuthz({ type: "orgQuery", queryKey: "organizationId" })
  async overview(
    @Param("relationshipId", ParseUUIDPipe) relationshipId: string,
    @Query("organizationId") organizationId: string,
  ) {
    await this.assertFlag(organizationId);
    return this.graph.buildGraphOverview(relationshipId);
  }

  @Get("propagation/:relationshipId")
  @VenextAuthz({ type: "orgQuery", queryKey: "organizationId" })
  async propagation(
    @Param("relationshipId", ParseUUIDPipe) relationshipId: string,
    @Query("organizationId") organizationId: string,
  ) {
    await this.assertFlag(organizationId);
    return this.graph.getPropagation(relationshipId);
  }

  @Get("clusters")
  @VenextAuthz({ type: "orgQuery", queryKey: "organizationId" })
  async clusters(
    @Query("organizationId") organizationId: string,
    @Query("relationshipId") relationshipId: string | undefined,
  ) {
    await this.assertFlag(organizationId);
    return this.graph.getClusters(relationshipId?.trim() || undefined);
  }

  @Post("signals/:id/archive")
  @VenextAuthz({ type: "orgQuery", queryKey: "organizationId" })
  async archive(
    @Param("id", ParseUUIDPipe) id: string,
    @Query("organizationId") organizationId: string,
    @Body() body: unknown,
    @Req() req: VenextHttpLike & { [VENEXT_COMMERCE_THREAD_ACTOR_KEY]?: CommerceThreadResolvedActor },
  ) {
    await this.assertFlag(organizationId);
    const actor = req[VENEXT_COMMERCE_THREAD_ACTOR_KEY]!;
    return this.graph.archiveSignal({
      nodeId: id,
      body,
      actorOrganizationId: actor.organizationId,
      actorUserId: actor.userId,
    });
  }
}
