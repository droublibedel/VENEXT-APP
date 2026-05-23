/**
 * Instruction 20.17 — human scenario review & decision board API (no commerce mutations).
 */
import { Body, Controller, ForbiddenException, Get, Param, ParseUUIDPipe, Post, Query, Req, UseGuards } from "@nestjs/common";

import { CanonicalFeatureFlagEvaluator } from "../../feature-flags/canonical-feature-flag.evaluator";
import type { VenextHttpLike } from "../../platform-authz/venext-auth-context";
import { VenextAuthzGuard } from "../../platform-authz/venext-authz.guard";
import { VenextAuthz } from "../../platform-authz/venext-authz.decorators";
import type { CommerceThreadResolvedActor } from "../commerce-thread-access/commerce-thread-actor-resolver.service";
import { VENEXT_COMMERCE_THREAD_ACTOR_KEY } from "../commerce-thread-access/commerce-thread-participant.guard";
import { RelationalScenarioReviewParticipantGuard } from "./relational-scenario-review-participant.guard";
import { RelationalScenarioReviewService } from "./relational-scenario-review.service";

@Controller("relational-scenario-review")
@UseGuards(VenextAuthzGuard, RelationalScenarioReviewParticipantGuard)
export class RelationalScenarioReviewController {
  constructor(
    private readonly flags: CanonicalFeatureFlagEvaluator,
    private readonly reviews: RelationalScenarioReviewService,
  ) {}

  private async assertFlag(organizationId: string): Promise<void> {
    if (!(await this.flags.isEnabled("relational_scenario_review_enabled", { organizationId }))) {
      throw new ForbiddenException({ code: "relational_scenario_review_disabled" });
    }
  }

  @Get("reviews")
  @VenextAuthz({ type: "orgQuery", queryKey: "organizationId" })
  async list(
    @Query("organizationId") organizationId: string,
    @Query("relationshipId") relationshipId: string | undefined,
  ) {
    await this.assertFlag(organizationId);
    return this.reviews.listReviews({
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
    return this.reviews.buildOverview(relationshipId);
  }

  @Post("reviews/:id/approve")
  @VenextAuthz({ type: "orgQuery", queryKey: "organizationId" })
  async approve(
    @Param("id", ParseUUIDPipe) id: string,
    @Query("organizationId") organizationId: string,
    @Body() body: unknown,
    @Req() req: VenextHttpLike & { [VENEXT_COMMERCE_THREAD_ACTOR_KEY]?: CommerceThreadResolvedActor },
  ) {
    await this.assertFlag(organizationId);
    const actor = req[VENEXT_COMMERCE_THREAD_ACTOR_KEY]!;
    return this.reviews.approveReview({
      reviewId: id,
      body,
      actorOrganizationId: actor.organizationId,
      actorUserId: actor.userId,
    });
  }

  @Post("reviews/:id/reject")
  @VenextAuthz({ type: "orgQuery", queryKey: "organizationId" })
  async reject(
    @Param("id", ParseUUIDPipe) id: string,
    @Query("organizationId") organizationId: string,
    @Body() body: unknown,
    @Req() req: VenextHttpLike & { [VENEXT_COMMERCE_THREAD_ACTOR_KEY]?: CommerceThreadResolvedActor },
  ) {
    await this.assertFlag(organizationId);
    const actor = req[VENEXT_COMMERCE_THREAD_ACTOR_KEY]!;
    return this.reviews.rejectReview({
      reviewId: id,
      body,
      actorOrganizationId: actor.organizationId,
      actorUserId: actor.userId,
    });
  }

  @Post("reviews/:id/archive")
  @VenextAuthz({ type: "orgQuery", queryKey: "organizationId" })
  async archive(
    @Param("id", ParseUUIDPipe) id: string,
    @Query("organizationId") organizationId: string,
    @Body() body: unknown,
    @Req() req: VenextHttpLike & { [VENEXT_COMMERCE_THREAD_ACTOR_KEY]?: CommerceThreadResolvedActor },
  ) {
    await this.assertFlag(organizationId);
    const actor = req[VENEXT_COMMERCE_THREAD_ACTOR_KEY]!;
    return this.reviews.archiveReview({
      reviewId: id,
      body,
      actorOrganizationId: actor.organizationId,
      actorUserId: actor.userId,
    });
  }

  @Post("reviews/:id/reevaluate")
  @VenextAuthz({ type: "orgQuery", queryKey: "organizationId" })
  async reevaluate(
    @Param("id", ParseUUIDPipe) id: string,
    @Query("organizationId") organizationId: string,
    @Body() body: unknown,
    @Req() req: VenextHttpLike & { [VENEXT_COMMERCE_THREAD_ACTOR_KEY]?: CommerceThreadResolvedActor },
  ) {
    await this.assertFlag(organizationId);
    const actor = req[VENEXT_COMMERCE_THREAD_ACTOR_KEY]!;
    return this.reviews.requestReevaluation({
      reviewId: id,
      body,
      actorOrganizationId: actor.organizationId,
      actorUserId: actor.userId,
    });
  }

  @Post("reviews/:id/request-executive-validation")
  @VenextAuthz({ type: "orgQuery", queryKey: "organizationId" })
  async executiveValidation(
    @Param("id", ParseUUIDPipe) id: string,
    @Query("organizationId") organizationId: string,
    @Body() body: unknown,
    @Req() req: VenextHttpLike & { [VENEXT_COMMERCE_THREAD_ACTOR_KEY]?: CommerceThreadResolvedActor },
  ) {
    await this.assertFlag(organizationId);
    const actor = req[VENEXT_COMMERCE_THREAD_ACTOR_KEY]!;
    return this.reviews.requestExecutiveValidation({
      reviewId: id,
      body,
      actorOrganizationId: actor.organizationId,
      actorUserId: actor.userId,
    });
  }
}
