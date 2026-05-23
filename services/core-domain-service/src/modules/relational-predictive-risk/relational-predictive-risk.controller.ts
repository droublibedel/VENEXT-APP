/**
 * Instruction 20.13 — deterministic predictive operational risk API.
 */
import { Body, Controller, ForbiddenException, Get, Param, ParseUUIDPipe, Post, Query, Req, UseGuards } from "@nestjs/common";

import { CanonicalFeatureFlagEvaluator } from "../../feature-flags/canonical-feature-flag.evaluator";
import type { VenextHttpLike } from "../../platform-authz/venext-auth-context";
import { VenextAuthzGuard } from "../../platform-authz/venext-authz.guard";
import { VenextAuthz } from "../../platform-authz/venext-authz.decorators";
import type { CommerceThreadResolvedActor } from "../commerce-thread-access/commerce-thread-actor-resolver.service";
import { VENEXT_COMMERCE_THREAD_ACTOR_KEY } from "../commerce-thread-access/commerce-thread-participant.guard";
import { RelationalPredictiveRiskParticipantGuard } from "./relational-predictive-risk-participant.guard";
import { RelationalPredictiveRiskService } from "./relational-predictive-risk.service";

@Controller("relational-predictive-risk")
@UseGuards(VenextAuthzGuard, RelationalPredictiveRiskParticipantGuard)
export class RelationalPredictiveRiskController {
  constructor(
    private readonly flags: CanonicalFeatureFlagEvaluator,
    private readonly predictive: RelationalPredictiveRiskService,
  ) {}

  private async assertPredictiveFlag(organizationId: string): Promise<void> {
    if (!(await this.flags.isEnabled("relational_predictive_risk_enabled", { organizationId }))) {
      throw new ForbiddenException({ code: "relational_predictive_risk_disabled" });
    }
  }

  private actorOrg(req: VenextHttpLike & { [VENEXT_COMMERCE_THREAD_ACTOR_KEY]?: CommerceThreadResolvedActor }): string {
    return req[VENEXT_COMMERCE_THREAD_ACTOR_KEY]!.organizationId;
  }

  @Get("signals")
  @VenextAuthz({ type: "orgQuery", queryKey: "organizationId" })
  async listSignals(
    @Query("organizationId") organizationId: string,
    @Query("relationshipId") relationshipId: string | undefined,
    @Query("unresolvedOnly") unresolvedOnly: string | undefined,
    @Req() req: VenextHttpLike & { [VENEXT_COMMERCE_THREAD_ACTOR_KEY]?: CommerceThreadResolvedActor },
  ) {
    await this.assertPredictiveFlag(organizationId);
    return this.predictive.listSignals({
      organizationId: this.actorOrg(req),
      relationshipId: relationshipId?.trim() || undefined,
      unresolvedOnly: unresolvedOnly === "1" || unresolvedOnly === "true",
    });
  }

  @Post("signals/:id/resolve")
  @VenextAuthz({ type: "orgQuery", queryKey: "organizationId" })
  async resolveSignal(
    @Param("id", ParseUUIDPipe) id: string,
    @Query("organizationId") organizationId: string,
    @Body() body: unknown,
    @Req() req: VenextHttpLike & { [VENEXT_COMMERCE_THREAD_ACTOR_KEY]?: CommerceThreadResolvedActor },
  ) {
    await this.assertPredictiveFlag(organizationId);
    return this.predictive.resolveSignal({
      organizationId: this.actorOrg(req),
      signalId: id,
      body,
    });
  }

  @Get("drift/:relationshipId")
  @VenextAuthz({ type: "orgQuery", queryKey: "organizationId" })
  async listDrift(
    @Param("relationshipId", ParseUUIDPipe) relationshipId: string,
    @Query("organizationId") organizationId: string,
    @Req() req: VenextHttpLike & { [VENEXT_COMMERCE_THREAD_ACTOR_KEY]?: CommerceThreadResolvedActor },
  ) {
    await this.assertPredictiveFlag(organizationId);
    return this.predictive.listDrift(relationshipId, this.actorOrg(req));
  }

  @Get("predictive-overview/:relationshipId")
  @VenextAuthz({ type: "orgQuery", queryKey: "organizationId" })
  async overview(
    @Param("relationshipId", ParseUUIDPipe) relationshipId: string,
    @Query("organizationId") organizationId: string,
    @Req() req: VenextHttpLike & { [VENEXT_COMMERCE_THREAD_ACTOR_KEY]?: CommerceThreadResolvedActor },
  ) {
    await this.assertPredictiveFlag(organizationId);
    return this.predictive.buildOverview(relationshipId, this.actorOrg(req));
  }
}
