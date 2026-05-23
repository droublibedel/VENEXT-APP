/**
 * Instruction 20.11 — corridor operational task coordination API.
 */
import { Body, Controller, ForbiddenException, Get, Param, ParseUUIDPipe, Post, Req, UseGuards } from "@nestjs/common";

import { CanonicalFeatureFlagEvaluator } from "../../feature-flags/canonical-feature-flag.evaluator";
import { parseVenextActorFromRequest, type VenextHttpLike } from "../../platform-authz/venext-auth-context";
import { VenextAuthzGuard } from "../../platform-authz/venext-authz.guard";
import { VenextAuthz } from "../../platform-authz/venext-authz.decorators";
import type { CommerceThreadResolvedActor } from "../commerce-thread-access/commerce-thread-actor-resolver.service";
import { VENEXT_COMMERCE_THREAD_ACTOR_KEY } from "../commerce-thread-access/commerce-thread-participant.guard";
import { resolveBackofficeCartOverride } from "../relational-cart/resolve-backoffice-cart-override";
import { RelationalFulfillmentCoordinationService } from "./relational-fulfillment-coordination.service";
import { RelationalFulfillmentParticipantGuard } from "./relational-fulfillment-participant.guard";
import { RelationalFulfillmentTaskParticipantGuard } from "./relational-fulfillment-task-participant.guard";

@Controller("relational-fulfillment")
@UseGuards(VenextAuthzGuard)
export class RelationalFulfillmentCoordinationController {
  constructor(
    private readonly flags: CanonicalFeatureFlagEvaluator,
    private readonly coordination: RelationalFulfillmentCoordinationService,
  ) {}

  private async assertCoordinationFlag(organizationId: string): Promise<void> {
    if (!(await this.flags.isEnabled("relational_fulfillment_enabled", { organizationId }))) {
      throw new ForbiddenException({ code: "relational_fulfillment_disabled" });
    }
    if (!(await this.flags.isEnabled("relational_fulfillment_coordination_enabled", { organizationId }))) {
      throw new ForbiddenException({ code: "relational_fulfillment_coordination_disabled" });
    }
  }

  private corridorOpts(req: VenextHttpLike) {
    const venextActor = parseVenextActorFromRequest(req);
    const override = resolveBackofficeCartOverride(venextActor, req, false);
    const allowDormant =
      process.env.VENEXT_FULFILLMENT_ALLOW_DORMANT_CORRIDOR === "1" ||
      process.env.VENEXT_FULFILLMENT_ALLOW_DORMANT_CORRIDOR === "true";
    return {
      allowRestrictedFulfillmentForBackoffice: override.allowRestrictedCommerceForBackoffice,
      allowDormantFulfillment: allowDormant,
    };
  }

  @Get(":id/tasks")
  @VenextAuthz({ type: "orgQuery", queryKey: "organizationId" })
  @UseGuards(RelationalFulfillmentParticipantGuard)
  async listTasks(
    @Param("id", ParseUUIDPipe) id: string,
    @Req() req: VenextHttpLike & { [VENEXT_COMMERCE_THREAD_ACTOR_KEY]?: CommerceThreadResolvedActor },
  ) {
    const a = req[VENEXT_COMMERCE_THREAD_ACTOR_KEY]!;
    await this.assertCoordinationFlag(a.organizationId);
    return this.coordination.listTasks(id, a.organizationId);
  }

  @Post(":id/tasks")
  @VenextAuthz({ type: "orgQuery", queryKey: "organizationId" })
  @UseGuards(RelationalFulfillmentParticipantGuard)
  async createTask(
    @Param("id", ParseUUIDPipe) id: string,
    @Req() req: VenextHttpLike & { [VENEXT_COMMERCE_THREAD_ACTOR_KEY]?: CommerceThreadResolvedActor },
    @Body() body: unknown,
  ) {
    const a = req[VENEXT_COMMERCE_THREAD_ACTOR_KEY]!;
    await this.assertCoordinationFlag(a.organizationId);
    return this.coordination.createTask({
      recordId: id,
      actorOrganizationId: a.organizationId,
      actorUserId: a.userId,
      body,
      ...this.corridorOpts(req),
    });
  }

  @Post("tasks/:taskId/assign")
  @VenextAuthz({ type: "orgQuery", queryKey: "organizationId" })
  @UseGuards(RelationalFulfillmentTaskParticipantGuard)
  async assignTask(
    @Param("taskId", ParseUUIDPipe) taskId: string,
    @Req() req: VenextHttpLike & { [VENEXT_COMMERCE_THREAD_ACTOR_KEY]?: CommerceThreadResolvedActor },
    @Body() body: unknown,
  ) {
    const a = req[VENEXT_COMMERCE_THREAD_ACTOR_KEY]!;
    await this.assertCoordinationFlag(a.organizationId);
    return this.coordination.assignTask({ taskId, actorOrganizationId: a.organizationId, actorUserId: a.userId, body, ...this.corridorOpts(req) });
  }

  @Post("tasks/:taskId/start")
  @VenextAuthz({ type: "orgQuery", queryKey: "organizationId" })
  @UseGuards(RelationalFulfillmentTaskParticipantGuard)
  async startTask(
    @Param("taskId", ParseUUIDPipe) taskId: string,
    @Req() req: VenextHttpLike & { [VENEXT_COMMERCE_THREAD_ACTOR_KEY]?: CommerceThreadResolvedActor },
  ) {
    const a = req[VENEXT_COMMERCE_THREAD_ACTOR_KEY]!;
    await this.assertCoordinationFlag(a.organizationId);
    return this.coordination.startTask({ taskId, actorOrganizationId: a.organizationId, actorUserId: a.userId, ...this.corridorOpts(req) });
  }

  @Post("tasks/:taskId/block")
  @VenextAuthz({ type: "orgQuery", queryKey: "organizationId" })
  @UseGuards(RelationalFulfillmentTaskParticipantGuard)
  async blockTask(
    @Param("taskId", ParseUUIDPipe) taskId: string,
    @Req() req: VenextHttpLike & { [VENEXT_COMMERCE_THREAD_ACTOR_KEY]?: CommerceThreadResolvedActor },
  ) {
    const a = req[VENEXT_COMMERCE_THREAD_ACTOR_KEY]!;
    await this.assertCoordinationFlag(a.organizationId);
    return this.coordination.blockTask({ taskId, actorOrganizationId: a.organizationId, actorUserId: a.userId, ...this.corridorOpts(req) });
  }

  @Post("tasks/:taskId/complete")
  @VenextAuthz({ type: "orgQuery", queryKey: "organizationId" })
  @UseGuards(RelationalFulfillmentTaskParticipantGuard)
  async completeTask(
    @Param("taskId", ParseUUIDPipe) taskId: string,
    @Req() req: VenextHttpLike & { [VENEXT_COMMERCE_THREAD_ACTOR_KEY]?: CommerceThreadResolvedActor },
  ) {
    const a = req[VENEXT_COMMERCE_THREAD_ACTOR_KEY]!;
    await this.assertCoordinationFlag(a.organizationId);
    return this.coordination.completeTask({ taskId, actorOrganizationId: a.organizationId, actorUserId: a.userId, ...this.corridorOpts(req) });
  }

  @Post("tasks/:taskId/reopen")
  @VenextAuthz({ type: "orgQuery", queryKey: "organizationId" })
  @UseGuards(RelationalFulfillmentTaskParticipantGuard)
  async reopenTask(
    @Param("taskId", ParseUUIDPipe) taskId: string,
    @Req() req: VenextHttpLike & { [VENEXT_COMMERCE_THREAD_ACTOR_KEY]?: CommerceThreadResolvedActor },
    @Body() body: unknown,
  ) {
    const a = req[VENEXT_COMMERCE_THREAD_ACTOR_KEY]!;
    await this.assertCoordinationFlag(a.organizationId);
    return this.coordination.reopenTask({ taskId, actorOrganizationId: a.organizationId, actorUserId: a.userId, body, ...this.corridorOpts(req) });
  }

  @Post("tasks/:taskId/cancel")
  @VenextAuthz({ type: "orgQuery", queryKey: "organizationId" })
  @UseGuards(RelationalFulfillmentTaskParticipantGuard)
  async cancelTask(
    @Param("taskId", ParseUUIDPipe) taskId: string,
    @Req() req: VenextHttpLike & { [VENEXT_COMMERCE_THREAD_ACTOR_KEY]?: CommerceThreadResolvedActor },
  ) {
    const a = req[VENEXT_COMMERCE_THREAD_ACTOR_KEY]!;
    await this.assertCoordinationFlag(a.organizationId);
    return this.coordination.cancelTask({ taskId, actorOrganizationId: a.organizationId, actorUserId: a.userId, ...this.corridorOpts(req) });
  }

  @Post("tasks/:taskId/comment")
  @VenextAuthz({ type: "orgQuery", queryKey: "organizationId" })
  @UseGuards(RelationalFulfillmentTaskParticipantGuard)
  async addComment(
    @Param("taskId", ParseUUIDPipe) taskId: string,
    @Req() req: VenextHttpLike & { [VENEXT_COMMERCE_THREAD_ACTOR_KEY]?: CommerceThreadResolvedActor },
    @Body() body: unknown,
  ) {
    const a = req[VENEXT_COMMERCE_THREAD_ACTOR_KEY]!;
    await this.assertCoordinationFlag(a.organizationId);
    return this.coordination.addTaskComment({ taskId, actorOrganizationId: a.organizationId, actorUserId: a.userId, body, ...this.corridorOpts(req) });
  }
}
