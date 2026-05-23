/**
 * Instruction 20.8 — relational order execution (corridor fulfillment core; not checkout / consumer tracking).
 */
import { BadRequestException, Body, Controller, ForbiddenException, Get, Param, ParseUUIDPipe, Post, Req, UseGuards } from "@nestjs/common";
import { RelationalOrderExecutionViewResponseSchema } from "@venext/shared-contracts";

import { CanonicalFeatureFlagEvaluator } from "../../feature-flags/canonical-feature-flag.evaluator";
import { parseVenextActorFromRequest, type VenextHttpLike } from "../../platform-authz/venext-auth-context";
import { VenextAuthzGuard } from "../../platform-authz/venext-authz.guard";
import { VenextAuthz } from "../../platform-authz/venext-authz.decorators";
import { type CommerceThreadResolvedActor } from "../commerce-thread-access/commerce-thread-actor-resolver.service";
import { VENEXT_COMMERCE_THREAD_ACTOR_KEY } from "../commerce-thread-access/commerce-thread-participant.guard";
import { resolveBackofficeCartOverride } from "../relational-cart/resolve-backoffice-cart-override";
import { RelationalOrderExecutionParticipantGuard } from "./relational-order-execution-participant.guard";
import { RelationalOrderExecutionService } from "./relational-order-execution.service";

@Controller("relational-order-execution")
@UseGuards(VenextAuthzGuard)
export class RelationalOrderExecutionController {
  constructor(
    private readonly flags: CanonicalFeatureFlagEvaluator,
    private readonly execution: RelationalOrderExecutionService,
  ) {}

  private async assertExecutionFlag(organizationId: string): Promise<void> {
    if (!(await this.flags.isEnabled("relational_order_execution_enabled", { organizationId }))) {
      throw new ForbiddenException({ code: "relational_order_execution_disabled" });
    }
  }

  @Get("orders/:orderId")
  @VenextAuthz({ type: "orgQuery", queryKey: "organizationId" })
  @UseGuards(RelationalOrderExecutionParticipantGuard)
  async getOne(@Param("orderId", ParseUUIDPipe) orderId: string, @Req() req: VenextHttpLike & { [VENEXT_COMMERCE_THREAD_ACTOR_KEY]?: CommerceThreadResolvedActor }) {
    const a = req[VENEXT_COMMERCE_THREAD_ACTOR_KEY]!;
    await this.assertExecutionFlag(a.organizationId);
    const view = await this.execution.getExecutionView(orderId, a.organizationId);
    const parsed = RelationalOrderExecutionViewResponseSchema.safeParse(view);
    if (!parsed.success) {
      throw new BadRequestException({ code: "relational_order_execution_view_contract_invalid" });
    }
    return parsed.data;
  }

  @Post("orders/:orderId/transitions")
  @VenextAuthz({ type: "orgQuery", queryKey: "organizationId" })
  @UseGuards(RelationalOrderExecutionParticipantGuard)
  async transition(
    @Param("orderId", ParseUUIDPipe) orderId: string,
    @Req() req: VenextHttpLike & { [VENEXT_COMMERCE_THREAD_ACTOR_KEY]?: CommerceThreadResolvedActor },
    @Body() body: unknown,
  ) {
    const a = req[VENEXT_COMMERCE_THREAD_ACTOR_KEY]!;
    await this.assertExecutionFlag(a.organizationId);
    const venextActor = parseVenextActorFromRequest(req);
    const override = resolveBackofficeCartOverride(venextActor, req, false);
    const allowDormant =
      process.env.VENEXT_ORDER_EXECUTION_ALLOW_DORMANT_CORRIDOR === "1" ||
      process.env.VENEXT_ORDER_EXECUTION_ALLOW_DORMANT_CORRIDOR === "true";
    return this.execution.applyTransition({
      orderId,
      actorOrganizationId: a.organizationId,
      actorUserId: a.userId,
      body,
      allowRestrictedOrderExecutionForBackoffice: override.allowRestrictedCommerceForBackoffice,
      allowDormantOrderExecution: allowDormant,
    });
  }
}
