/**
 * Instruction 20.16 — deterministic operational simulation API (read-only analytics).
 */
import { Body, Controller, ForbiddenException, Get, Param, ParseUUIDPipe, Post, Query, Req, UseGuards } from "@nestjs/common";

import { CanonicalFeatureFlagEvaluator } from "../../feature-flags/canonical-feature-flag.evaluator";
import type { VenextHttpLike } from "../../platform-authz/venext-auth-context";
import { VenextAuthzGuard } from "../../platform-authz/venext-authz.guard";
import { VenextAuthz } from "../../platform-authz/venext-authz.decorators";
import type { CommerceThreadResolvedActor } from "../commerce-thread-access/commerce-thread-actor-resolver.service";
import { VENEXT_COMMERCE_THREAD_ACTOR_KEY } from "../commerce-thread-access/commerce-thread-participant.guard";
import { RelationalOperationalSimulationParticipantGuard } from "./relational-operational-simulation-participant.guard";
import { RelationalOperationalSimulationService } from "./relational-operational-simulation.service";

@Controller("relational-operational-simulation")
@UseGuards(VenextAuthzGuard, RelationalOperationalSimulationParticipantGuard)
export class RelationalOperationalSimulationController {
  constructor(
    private readonly flags: CanonicalFeatureFlagEvaluator,
    private readonly simulation: RelationalOperationalSimulationService,
  ) {}

  private async assertFlag(organizationId: string): Promise<void> {
    if (!(await this.flags.isEnabled("relational_operational_simulation_enabled", { organizationId }))) {
      throw new ForbiddenException({ code: "relational_operational_simulation_disabled" });
    }
  }

  @Get("simulations")
  @VenextAuthz({ type: "orgQuery", queryKey: "organizationId" })
  async list(
    @Query("organizationId") organizationId: string,
    @Query("relationshipId") relationshipId: string | undefined,
  ) {
    await this.assertFlag(organizationId);
    return this.simulation.listSimulations({
      organizationId,
      relationshipId: relationshipId?.trim() || undefined,
    });
  }

  @Get("overview/:relationshipId")
  @VenextAuthz({ type: "orgQuery", queryKey: "organizationId" })
  async overview(
    @Param("relationshipId", ParseUUIDPipe) relationshipId: string,
    @Query("organizationId") organizationId: string,
  ) {
    await this.assertFlag(organizationId);
    return this.simulation.buildOverview(relationshipId);
  }

  @Post("simulations/run")
  @VenextAuthz({ type: "orgQuery", queryKey: "organizationId" })
  async run(
    @Query("organizationId") organizationId: string,
    @Query("relationshipId", ParseUUIDPipe) relationshipId: string,
    @Body() body: unknown,
  ) {
    await this.assertFlag(organizationId);
    return this.simulation.runSimulation({ relationshipId, body });
  }

  @Post("simulations/:id/cancel")
  @VenextAuthz({ type: "orgQuery", queryKey: "organizationId" })
  async cancel(
    @Param("id", ParseUUIDPipe) id: string,
    @Query("organizationId") organizationId: string,
    @Body() body: unknown,
  ) {
    await this.assertFlag(organizationId);
    return this.simulation.cancel({ simulationId: id, body });
  }

  @Post("simulations/:id/review")
  @VenextAuthz({ type: "orgQuery", queryKey: "organizationId" })
  async review(
    @Param("id", ParseUUIDPipe) id: string,
    @Query("organizationId") organizationId: string,
    @Body() body: unknown,
    @Req() req: VenextHttpLike & { [VENEXT_COMMERCE_THREAD_ACTOR_KEY]?: CommerceThreadResolvedActor },
  ) {
    await this.assertFlag(organizationId);
    const actor = req[VENEXT_COMMERCE_THREAD_ACTOR_KEY]!;
    return this.simulation.review({ simulationId: id, userId: actor.userId, body });
  }
}
