import { Body, Controller, ForbiddenException, Get, Param, ParseUUIDPipe, Post, Req, UseGuards } from "@nestjs/common";

import type { VenextHttpLike } from "../../platform-authz/venext-auth-context";
import { CanonicalFeatureFlagEvaluator } from "../../feature-flags/canonical-feature-flag.evaluator";
import type { CommerceThreadResolvedActor } from "../commerce-thread-access/commerce-thread-actor-resolver.service";
import {
  CommerceMessagingActorGuard,
  VENEXT_COMMERCE_THREAD_ACTOR_KEY,
} from "../commerce-thread-access/commerce-thread-participant.guard";
import { SponsoredCommercialFlowService } from "./sponsored-commercial-flow.service";

@Controller("sponsored-discovery")
@UseGuards(CommerceMessagingActorGuard)
export class SponsoredDiscoveryController {
  constructor(
    private readonly flow: SponsoredCommercialFlowService,
    private readonly flags: CanonicalFeatureFlagEvaluator,
  ) {}

  private async assertFlag(actor: CommerceThreadResolvedActor) {
    const on = await this.flags.isEnabled("sponsored_commercial_discovery_v1", { organizationId: actor.organizationId });
    if (!on) throw new ForbiddenException({ code: "sponsored_commercial_discovery_disabled" });
  }

  @Get("campaign-product-surface/:campaignId")
  async campaignProductSurface(
    @Req() req: VenextHttpLike & { [VENEXT_COMMERCE_THREAD_ACTOR_KEY]?: CommerceThreadResolvedActor },
    @Param("campaignId", ParseUUIDPipe) campaignId: string,
  ) {
    const actor = req[VENEXT_COMMERCE_THREAD_ACTOR_KEY]!;
    await this.assertFlag(actor);
    return this.flow.getCampaignProductSurface(actor, campaignId);
  }

  @Post("evaluate")
  async evaluate(
    @Req() req: VenextHttpLike & { [VENEXT_COMMERCE_THREAD_ACTOR_KEY]?: CommerceThreadResolvedActor },
    @Body() body: { campaignId: string },
  ) {
    const actor = req[VENEXT_COMMERCE_THREAD_ACTOR_KEY]!;
    await this.assertFlag(actor);
    return this.flow.evaluateDiscovery(actor, body.campaignId);
  }

  @Post("open")
  async open(
    @Req() req: VenextHttpLike & { [VENEXT_COMMERCE_THREAD_ACTOR_KEY]?: CommerceThreadResolvedActor },
    @Body() body: { campaignId: string },
  ) {
    const actor = req[VENEXT_COMMERCE_THREAD_ACTOR_KEY]!;
    await this.assertFlag(actor);
    return this.flow.openSponsoredConversation(actor, body.campaignId);
  }

  @Post("relationship-request")
  async relationshipRequest(
    @Req() req: VenextHttpLike & { [VENEXT_COMMERCE_THREAD_ACTOR_KEY]?: CommerceThreadResolvedActor },
    @Body() body: { windowId: string; motivation?: string },
  ) {
    const actor = req[VENEXT_COMMERCE_THREAD_ACTOR_KEY]!;
    await this.assertFlag(actor);
    return this.flow.requestOfficialRelationship(actor, { windowId: body.windowId, motivation: body.motivation });
  }
}
