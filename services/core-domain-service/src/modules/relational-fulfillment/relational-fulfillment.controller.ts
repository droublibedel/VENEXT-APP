/**
 * Instruction 20.9 / 20.10 — relational fulfillment, reception proof & incident resolution.
 */
import { Body, Controller, ForbiddenException, Get, Param, ParseUUIDPipe, Post, Query, Req, UseGuards } from "@nestjs/common";

import { CanonicalFeatureFlagEvaluator } from "../../feature-flags/canonical-feature-flag.evaluator";
import { parseVenextActorFromRequest, type VenextHttpLike } from "../../platform-authz/venext-auth-context";
import { VenextAuthzGuard } from "../../platform-authz/venext-authz.guard";
import { VenextAuthz } from "../../platform-authz/venext-authz.decorators";
import type { CommerceThreadResolvedActor } from "../commerce-thread-access/commerce-thread-actor-resolver.service";
import { VENEXT_COMMERCE_THREAD_ACTOR_KEY } from "../commerce-thread-access/commerce-thread-participant.guard";
import { resolveBackofficeCartOverride } from "../relational-cart/resolve-backoffice-cart-override";
import { RelationalFulfillmentIncidentParticipantGuard } from "./relational-fulfillment-incident-participant.guard";
import { RelationalFulfillmentParticipantGuard } from "./relational-fulfillment-participant.guard";
import { RelationalFulfillmentResolutionService } from "./relational-fulfillment-resolution.service";
import { RelationalFulfillmentService } from "./relational-fulfillment.service";

@Controller("relational-fulfillment")
@UseGuards(VenextAuthzGuard)
export class RelationalFulfillmentController {
  constructor(
    private readonly flags: CanonicalFeatureFlagEvaluator,
    private readonly fulfillment: RelationalFulfillmentService,
    private readonly resolution: RelationalFulfillmentResolutionService,
  ) {}

  private async assertFulfillmentFlag(organizationId: string): Promise<void> {
    if (!(await this.flags.isEnabled("relational_fulfillment_enabled", { organizationId }))) {
      throw new ForbiddenException({ code: "relational_fulfillment_disabled" });
    }
  }

  private async assertResolutionFlag(organizationId: string): Promise<void> {
    await this.assertFulfillmentFlag(organizationId);
    if (!(await this.flags.isEnabled("relational_fulfillment_incident_resolution_enabled", { organizationId }))) {
      throw new ForbiddenException({ code: "relational_fulfillment_incident_resolution_disabled" });
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

  @Get("orders/:orderId")
  @VenextAuthz({ type: "orgQuery", queryKey: "organizationId" })
  async getByOrder(
    @Param("orderId", ParseUUIDPipe) orderId: string,
    @Query("organizationId") organizationId: string,
  ) {
    await this.assertFulfillmentFlag(organizationId);
    return this.fulfillment.getViewByOrderId(orderId, organizationId);
  }

  @Post("incidents/:incidentId/propose-resolution")
  @VenextAuthz({ type: "orgQuery", queryKey: "organizationId" })
  @UseGuards(RelationalFulfillmentIncidentParticipantGuard)
  async proposeResolution(
    @Param("incidentId", ParseUUIDPipe) incidentId: string,
    @Req() req: VenextHttpLike & { [VENEXT_COMMERCE_THREAD_ACTOR_KEY]?: CommerceThreadResolvedActor },
    @Body() body: unknown,
  ) {
    const a = req[VENEXT_COMMERCE_THREAD_ACTOR_KEY]!;
    await this.assertResolutionFlag(a.organizationId);
    return this.resolution.proposeResolution({
      incidentId,
      actorOrganizationId: a.organizationId,
      actorUserId: a.userId,
      body,
      ...this.corridorOpts(req),
    });
  }

  @Post("incidents/:incidentId/accept-resolution-buyer")
  @VenextAuthz({ type: "orgQuery", queryKey: "organizationId" })
  @UseGuards(RelationalFulfillmentIncidentParticipantGuard)
  async acceptResolutionBuyer(
    @Param("incidentId", ParseUUIDPipe) incidentId: string,
    @Req() req: VenextHttpLike & { [VENEXT_COMMERCE_THREAD_ACTOR_KEY]?: CommerceThreadResolvedActor },
  ) {
    const a = req[VENEXT_COMMERCE_THREAD_ACTOR_KEY]!;
    await this.assertResolutionFlag(a.organizationId);
    return this.resolution.acceptResolutionBuyer({
      incidentId,
      actorOrganizationId: a.organizationId,
      actorUserId: a.userId,
      ...this.corridorOpts(req),
    });
  }

  @Post("incidents/:incidentId/accept-resolution-seller")
  @VenextAuthz({ type: "orgQuery", queryKey: "organizationId" })
  @UseGuards(RelationalFulfillmentIncidentParticipantGuard)
  async acceptResolutionSeller(
    @Param("incidentId", ParseUUIDPipe) incidentId: string,
    @Req() req: VenextHttpLike & { [VENEXT_COMMERCE_THREAD_ACTOR_KEY]?: CommerceThreadResolvedActor },
  ) {
    const a = req[VENEXT_COMMERCE_THREAD_ACTOR_KEY]!;
    await this.assertResolutionFlag(a.organizationId);
    return this.resolution.acceptResolutionSeller({
      incidentId,
      actorOrganizationId: a.organizationId,
      actorUserId: a.userId,
      ...this.corridorOpts(req),
    });
  }

  @Get(":id")
  @VenextAuthz({ type: "orgQuery", queryKey: "organizationId" })
  @UseGuards(RelationalFulfillmentParticipantGuard)
  async getOne(
    @Param("id", ParseUUIDPipe) id: string,
    @Req() req: VenextHttpLike & { [VENEXT_COMMERCE_THREAD_ACTOR_KEY]?: CommerceThreadResolvedActor },
  ) {
    const a = req[VENEXT_COMMERCE_THREAD_ACTOR_KEY]!;
    await this.assertFulfillmentFlag(a.organizationId);
    return this.fulfillment.getView(id, a.organizationId);
  }

  @Post(":id/transitions")
  @VenextAuthz({ type: "orgQuery", queryKey: "organizationId" })
  @UseGuards(RelationalFulfillmentParticipantGuard)
  async transition(
    @Param("id", ParseUUIDPipe) id: string,
    @Req() req: VenextHttpLike & { [VENEXT_COMMERCE_THREAD_ACTOR_KEY]?: CommerceThreadResolvedActor },
    @Body() body: unknown,
  ) {
    const a = req[VENEXT_COMMERCE_THREAD_ACTOR_KEY]!;
    await this.assertFulfillmentFlag(a.organizationId);
    return this.fulfillment.applyTransition({
      recordId: id,
      actorOrganizationId: a.organizationId,
      actorUserId: a.userId,
      body,
      ...this.corridorOpts(req),
    });
  }

  @Post(":id/proofs")
  @VenextAuthz({ type: "orgQuery", queryKey: "organizationId" })
  @UseGuards(RelationalFulfillmentParticipantGuard)
  async submitProof(
    @Param("id", ParseUUIDPipe) id: string,
    @Req() req: VenextHttpLike & { [VENEXT_COMMERCE_THREAD_ACTOR_KEY]?: CommerceThreadResolvedActor },
    @Body() body: unknown,
  ) {
    const a = req[VENEXT_COMMERCE_THREAD_ACTOR_KEY]!;
    await this.assertFulfillmentFlag(a.organizationId);
    if (!(await this.flags.isEnabled("relational_fulfillment_proof_enabled", { organizationId: a.organizationId }))) {
      throw new ForbiddenException({ code: "relational_fulfillment_proof_disabled" });
    }
    return this.fulfillment.submitReceptionProof({
      recordId: id,
      actorOrganizationId: a.organizationId,
      actorUserId: a.userId,
      body,
      ...this.corridorOpts(req),
    });
  }

  @Post(":id/validate-reception")
  @VenextAuthz({ type: "orgQuery", queryKey: "organizationId" })
  @UseGuards(RelationalFulfillmentParticipantGuard)
  async validateReception(
    @Param("id", ParseUUIDPipe) id: string,
    @Req() req: VenextHttpLike & { [VENEXT_COMMERCE_THREAD_ACTOR_KEY]?: CommerceThreadResolvedActor },
    @Body() body: unknown,
  ) {
    const a = req[VENEXT_COMMERCE_THREAD_ACTOR_KEY]!;
    await this.assertFulfillmentFlag(a.organizationId);
    return this.fulfillment.validateReception({
      recordId: id,
      actorOrganizationId: a.organizationId,
      actorUserId: a.userId,
      body,
      ...this.corridorOpts(req),
    });
  }

  @Post(":id/reject-reception")
  @VenextAuthz({ type: "orgQuery", queryKey: "organizationId" })
  @UseGuards(RelationalFulfillmentParticipantGuard)
  async rejectReception(
    @Param("id", ParseUUIDPipe) id: string,
    @Req() req: VenextHttpLike & { [VENEXT_COMMERCE_THREAD_ACTOR_KEY]?: CommerceThreadResolvedActor },
    @Body() body: unknown,
  ) {
    const a = req[VENEXT_COMMERCE_THREAD_ACTOR_KEY]!;
    await this.assertResolutionFlag(a.organizationId);
    return this.resolution.rejectReception({
      recordId: id,
      actorOrganizationId: a.organizationId,
      actorUserId: a.userId,
      body,
      ...this.corridorOpts(req),
    });
  }

  @Post(":id/validate-partial-reception")
  @VenextAuthz({ type: "orgQuery", queryKey: "organizationId" })
  @UseGuards(RelationalFulfillmentParticipantGuard)
  async validatePartialReception(
    @Param("id", ParseUUIDPipe) id: string,
    @Req() req: VenextHttpLike & { [VENEXT_COMMERCE_THREAD_ACTOR_KEY]?: CommerceThreadResolvedActor },
    @Body() body: unknown,
  ) {
    const a = req[VENEXT_COMMERCE_THREAD_ACTOR_KEY]!;
    await this.assertResolutionFlag(a.organizationId);
    return this.resolution.validatePartialReception({
      recordId: id,
      actorOrganizationId: a.organizationId,
      actorUserId: a.userId,
      body,
      ...this.corridorOpts(req),
    });
  }

  @Post(":id/report-incident")
  @VenextAuthz({ type: "orgQuery", queryKey: "organizationId" })
  @UseGuards(RelationalFulfillmentParticipantGuard)
  async reportIncident(
    @Param("id", ParseUUIDPipe) id: string,
    @Req() req: VenextHttpLike & { [VENEXT_COMMERCE_THREAD_ACTOR_KEY]?: CommerceThreadResolvedActor },
    @Body() body: unknown,
  ) {
    const a = req[VENEXT_COMMERCE_THREAD_ACTOR_KEY]!;
    await this.assertFulfillmentFlag(a.organizationId);
    return this.fulfillment.reportIncident({
      recordId: id,
      actorOrganizationId: a.organizationId,
      actorUserId: a.userId,
      body,
      ...this.corridorOpts(req),
    });
  }
}
