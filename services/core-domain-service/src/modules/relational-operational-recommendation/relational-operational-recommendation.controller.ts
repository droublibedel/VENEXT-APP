/**
 * Instruction 20.14 — deterministic operational recommendation API.
 */
import { Body, Controller, ForbiddenException, Get, Param, ParseUUIDPipe, Post, Query, Req, UseGuards } from "@nestjs/common";

import { CanonicalFeatureFlagEvaluator } from "../../feature-flags/canonical-feature-flag.evaluator";
import type { VenextHttpLike } from "../../platform-authz/venext-auth-context";
import { VenextAuthzGuard } from "../../platform-authz/venext-authz.guard";
import { VenextAuthz } from "../../platform-authz/venext-authz.decorators";
import type { CommerceThreadResolvedActor } from "../commerce-thread-access/commerce-thread-actor-resolver.service";
import { VENEXT_COMMERCE_THREAD_ACTOR_KEY } from "../commerce-thread-access/commerce-thread-participant.guard";
import { RelationalOperationalRecommendationParticipantGuard } from "./relational-operational-recommendation-participant.guard";
import { RelationalOperationalRecommendationService } from "./relational-operational-recommendation.service";

@Controller("relational-operational-recommendation")
@UseGuards(VenextAuthzGuard, RelationalOperationalRecommendationParticipantGuard)
export class RelationalOperationalRecommendationController {
  constructor(
    private readonly flags: CanonicalFeatureFlagEvaluator,
    private readonly recommendations: RelationalOperationalRecommendationService,
  ) {}

  private async assertFlag(organizationId: string): Promise<void> {
    if (!(await this.flags.isEnabled("relational_operational_recommendation_enabled", { organizationId }))) {
      throw new ForbiddenException({ code: "relational_operational_recommendation_disabled" });
    }
  }

  private actor(req: VenextHttpLike & { [VENEXT_COMMERCE_THREAD_ACTOR_KEY]?: CommerceThreadResolvedActor }) {
    const a = req[VENEXT_COMMERCE_THREAD_ACTOR_KEY]!;
    return { organizationId: a.organizationId, userId: a.userId };
  }

  @Get("recommendations")
  @VenextAuthz({ type: "orgQuery", queryKey: "organizationId" })
  async list(
    @Query("organizationId") organizationId: string,
    @Query("relationshipId") relationshipId: string | undefined,
    @Query("activeOnly") activeOnly: string | undefined,
    @Req() req: VenextHttpLike & { [VENEXT_COMMERCE_THREAD_ACTOR_KEY]?: CommerceThreadResolvedActor },
  ) {
    await this.assertFlag(organizationId);
    return this.recommendations.listRecommendations({
      organizationId: this.actor(req).organizationId,
      relationshipId: relationshipId?.trim() || undefined,
      activeOnly: activeOnly !== "false",
    });
  }

  @Get("overview/:relationshipId")
  @VenextAuthz({ type: "orgQuery", queryKey: "organizationId" })
  async overview(
    @Param("relationshipId", ParseUUIDPipe) relationshipId: string,
    @Query("organizationId") organizationId: string,
    @Req() req: VenextHttpLike & { [VENEXT_COMMERCE_THREAD_ACTOR_KEY]?: CommerceThreadResolvedActor },
  ) {
    await this.assertFlag(organizationId);
    return this.recommendations.buildOverview(relationshipId, this.actor(req).organizationId);
  }

  @Post("recommendations/:id/acknowledge")
  @VenextAuthz({ type: "orgQuery", queryKey: "organizationId" })
  async acknowledge(
    @Param("id", ParseUUIDPipe) id: string,
    @Query("organizationId") organizationId: string,
    @Body() body: unknown,
    @Req() req: VenextHttpLike & { [VENEXT_COMMERCE_THREAD_ACTOR_KEY]?: CommerceThreadResolvedActor },
  ) {
    await this.assertFlag(organizationId);
    const a = this.actor(req);
    return this.recommendations.acknowledge({
      organizationId: a.organizationId,
      userId: a.userId,
      recommendationId: id,
      body,
    });
  }

  @Post("recommendations/:id/dismiss")
  @VenextAuthz({ type: "orgQuery", queryKey: "organizationId" })
  async dismiss(
    @Param("id", ParseUUIDPipe) id: string,
    @Query("organizationId") organizationId: string,
    @Body() body: unknown,
    @Req() req: VenextHttpLike & { [VENEXT_COMMERCE_THREAD_ACTOR_KEY]?: CommerceThreadResolvedActor },
  ) {
    await this.assertFlag(organizationId);
    const a = this.actor(req);
    return this.recommendations.dismiss({
      organizationId: a.organizationId,
      userId: a.userId,
      recommendationId: id,
      body,
    });
  }

  @Post("recommendations/:id/resolve")
  @VenextAuthz({ type: "orgQuery", queryKey: "organizationId" })
  async resolve(
    @Param("id", ParseUUIDPipe) id: string,
    @Query("organizationId") organizationId: string,
    @Body() body: unknown,
    @Req() req: VenextHttpLike & { [VENEXT_COMMERCE_THREAD_ACTOR_KEY]?: CommerceThreadResolvedActor },
  ) {
    await this.assertFlag(organizationId);
    const a = this.actor(req);
    return this.recommendations.resolve({
      organizationId: a.organizationId,
      userId: a.userId,
      recommendationId: id,
      body,
    });
  }
}
