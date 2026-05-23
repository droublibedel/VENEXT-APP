/**
 * Instruction 20.15 — deterministic operational orchestration API.
 */
import { Body, Controller, ForbiddenException, Get, Param, ParseUUIDPipe, Post, Query, Req, UseGuards } from "@nestjs/common";

import { CanonicalFeatureFlagEvaluator } from "../../feature-flags/canonical-feature-flag.evaluator";
import type { VenextHttpLike } from "../../platform-authz/venext-auth-context";
import { VenextAuthzGuard } from "../../platform-authz/venext-authz.guard";
import { VenextAuthz } from "../../platform-authz/venext-authz.decorators";
import type { CommerceThreadResolvedActor } from "../commerce-thread-access/commerce-thread-actor-resolver.service";
import { VENEXT_COMMERCE_THREAD_ACTOR_KEY } from "../commerce-thread-access/commerce-thread-participant.guard";
import { RelationalOperationalOrchestrationParticipantGuard } from "./relational-operational-orchestration-participant.guard";
import { RelationalOperationalOrchestrationService } from "./relational-operational-orchestration.service";

@Controller("relational-operational-orchestration")
@UseGuards(VenextAuthzGuard, RelationalOperationalOrchestrationParticipantGuard)
export class RelationalOperationalOrchestrationController {
  constructor(
    private readonly flags: CanonicalFeatureFlagEvaluator,
    private readonly orchestration: RelationalOperationalOrchestrationService,
  ) {}

  private async assertFlag(organizationId: string): Promise<void> {
    if (!(await this.flags.isEnabled("relational_operational_orchestration_enabled", { organizationId }))) {
      throw new ForbiddenException({ code: "relational_operational_orchestration_disabled" });
    }
  }

  private actor(req: VenextHttpLike & { [VENEXT_COMMERCE_THREAD_ACTOR_KEY]?: CommerceThreadResolvedActor }) {
    const a = req[VENEXT_COMMERCE_THREAD_ACTOR_KEY]!;
    return { organizationId: a.organizationId, userId: a.userId };
  }

  @Get("orchestrations")
  @VenextAuthz({ type: "orgQuery", queryKey: "organizationId" })
  async list(
    @Query("organizationId") organizationId: string,
    @Query("relationshipId") relationshipId: string | undefined,
    @Query("openOnly") openOnly: string | undefined,
    @Req() req: VenextHttpLike & { [VENEXT_COMMERCE_THREAD_ACTOR_KEY]?: CommerceThreadResolvedActor },
  ) {
    await this.assertFlag(organizationId);
    return this.orchestration.listOrchestrations({
      organizationId: this.actor(req).organizationId,
      relationshipId: relationshipId?.trim() || undefined,
      openOnly: openOnly !== "false",
    });
  }

  @Get("overview/:relationshipId")
  @VenextAuthz({ type: "orgQuery", queryKey: "organizationId" })
  async overview(
    @Param("relationshipId", ParseUUIDPipe) relationshipId: string,
    @Query("organizationId") organizationId: string,
  ) {
    await this.assertFlag(organizationId);
    return this.orchestration.buildOverview(relationshipId);
  }

  @Post("orchestrations/:id/approve")
  @VenextAuthz({ type: "orgQuery", queryKey: "organizationId" })
  async approve(
    @Param("id", ParseUUIDPipe) id: string,
    @Query("organizationId") organizationId: string,
    @Body() body: unknown,
    @Req() req: VenextHttpLike & { [VENEXT_COMMERCE_THREAD_ACTOR_KEY]?: CommerceThreadResolvedActor },
  ) {
    await this.assertFlag(organizationId);
    return this.orchestration.approve({ orchestrationId: id, userId: this.actor(req).userId, body });
  }

  @Post("orchestrations/:id/start")
  @VenextAuthz({ type: "orgQuery", queryKey: "organizationId" })
  async start(
    @Param("id", ParseUUIDPipe) id: string,
    @Query("organizationId") organizationId: string,
    @Body() body: unknown,
  ) {
    await this.assertFlag(organizationId);
    return this.orchestration.start({ orchestrationId: id, body });
  }

  @Post("orchestrations/:id/pause")
  @VenextAuthz({ type: "orgQuery", queryKey: "organizationId" })
  async pause(
    @Param("id", ParseUUIDPipe) id: string,
    @Query("organizationId") organizationId: string,
    @Body() body: unknown,
  ) {
    await this.assertFlag(organizationId);
    return this.orchestration.pause({ orchestrationId: id, body });
  }

  @Post("orchestrations/:id/cancel")
  @VenextAuthz({ type: "orgQuery", queryKey: "organizationId" })
  async cancel(
    @Param("id", ParseUUIDPipe) id: string,
    @Query("organizationId") organizationId: string,
    @Body() body: unknown,
  ) {
    await this.assertFlag(organizationId);
    return this.orchestration.cancel({ orchestrationId: id, body });
  }

  @Post("steps/:stepId/complete")
  @VenextAuthz({ type: "orgQuery", queryKey: "organizationId" })
  async completeStep(
    @Param("stepId", ParseUUIDPipe) stepId: string,
    @Query("organizationId") organizationId: string,
    @Body() body: unknown,
    @Req() req: VenextHttpLike & { [VENEXT_COMMERCE_THREAD_ACTOR_KEY]?: CommerceThreadResolvedActor },
  ) {
    await this.assertFlag(organizationId);
    return this.orchestration.completeStep({ stepId, userId: this.actor(req).userId, body });
  }

  @Post("steps/:stepId/reopen")
  @VenextAuthz({ type: "orgQuery", queryKey: "organizationId" })
  async reopenStep(
    @Param("stepId", ParseUUIDPipe) stepId: string,
    @Query("organizationId") organizationId: string,
    @Body() body: unknown,
  ) {
    await this.assertFlag(organizationId);
    return this.orchestration.reopenStep({ stepId, body });
  }
}
