import { BadRequestException, Body, Controller, Get, Param, ParseUUIDPipe, Post, Req, UseGuards } from "@nestjs/common";

import { DirectCatalogCartRequestSchema } from "@venext/shared-contracts";

import { parseVenextActorFromRequest, type VenextHttpLike } from "../../platform-authz/venext-auth-context";
import type { CommerceThreadResolvedActor } from "../commerce-thread-access/commerce-thread-actor-resolver.service";
import { CommerceThreadParticipantGuard } from "../commerce-thread-access/commerce-thread-participant.guard";
import { VENEXT_COMMERCE_THREAD_ACTOR_KEY } from "../commerce-thread-access/commerce-thread-participant.guard";
import { RelationalCartConversionService } from "./relational-cart-conversion.service";
import { RelationalCartDirectCatalogGuard } from "./relational-cart-direct-catalog.guard";
import { RelationalCartFromNegotiationGuard } from "./relational-cart-from-negotiation.guard";
import { RelationalCartParticipantGuard } from "./relational-cart-participant.guard";
import { RelationalCartService } from "./relational-cart.service";
import { resolveBackofficeCartOverride } from "./resolve-backoffice-cart-override";

@Controller("relational-cart")
export class RelationalCartController {
  constructor(
    private readonly carts: RelationalCartService,
    private readonly conversion: RelationalCartConversionService,
  ) {}

  @Get(":cartId")
  @UseGuards(RelationalCartParticipantGuard)
  getOne(
    @Param("cartId", ParseUUIDPipe) cartId: string,
    @Req() req: VenextHttpLike & { [VENEXT_COMMERCE_THREAD_ACTOR_KEY]?: CommerceThreadResolvedActor },
  ) {
    const a = req[VENEXT_COMMERCE_THREAD_ACTOR_KEY]!;
    return this.carts.getCart(cartId, a.organizationId);
  }

  @Post("from-negotiation/:negotiationId")
  @UseGuards(RelationalCartFromNegotiationGuard)
  fromNegotiation(
    @Param("negotiationId", ParseUUIDPipe) negotiationId: string,
    @Req() req: VenextHttpLike & { [VENEXT_COMMERCE_THREAD_ACTOR_KEY]?: CommerceThreadResolvedActor },
  ) {
    const a = req[VENEXT_COMMERCE_THREAD_ACTOR_KEY]!;
    return this.carts.createCartFromNegotiation(negotiationId, a.userId, a.organizationId, { markNegotiationConverted: false });
  }

  @Post("from-draft/:threadId")
  @UseGuards(CommerceThreadParticipantGuard)
  fromDraft(
    @Param("threadId", ParseUUIDPipe) threadId: string,
    @Req() req: VenextHttpLike & { [VENEXT_COMMERCE_THREAD_ACTOR_KEY]?: CommerceThreadResolvedActor },
    @Body()
    body: {
      relationshipId?: string;
      negotiationId: string;
      productId: string;
      quantity: number;
      unitPrice: number;
      quantityUnit: string;
      currency?: string | null;
      sourceMessageId?: string | null;
    },
  ) {
    if (body?.relationshipId !== undefined && body?.relationshipId !== null && String(body.relationshipId).trim() !== "") {
      throw new BadRequestException({
        code: "client_relationship_id_not_allowed",
        detail: "relationshipId is server-derived for from-draft; omit this field.",
      });
    }
    const a = req[VENEXT_COMMERCE_THREAD_ACTOR_KEY]!;
    return this.carts.createCartFromConversationalDraft({
      threadId,
      actorUserId: a.userId,
      actorOrganizationId: a.organizationId,
      negotiationId: body.negotiationId,
      productId: body.productId,
      quantity: body.quantity,
      unitPrice: body.unitPrice,
      quantityUnit: body.quantityUnit,
      currency: body.currency,
      sourceMessageId: body.sourceMessageId,
    });
  }

  @Post("from-catalog")
  @UseGuards(RelationalCartDirectCatalogGuard)
  fromCatalog(
    @Req() req: VenextHttpLike & { [VENEXT_COMMERCE_THREAD_ACTOR_KEY]?: CommerceThreadResolvedActor },
    @Body() raw: unknown,
  ) {
    const parsed = DirectCatalogCartRequestSchema.safeParse(raw);
    if (!parsed.success) {
      throw new BadRequestException({ code: "relational_cart_direct_catalog_invalid_body", issues: parsed.error.flatten() });
    }
    const a = req[VENEXT_COMMERCE_THREAD_ACTOR_KEY]!;
    const venextActor = parseVenextActorFromRequest(req);
    const override = resolveBackofficeCartOverride(venextActor, req, false);
    return this.carts.addFromDirectCatalog({
      ...parsed.data,
      catalogId: parsed.data.catalogId ?? null,
      actorNote: parsed.data.actorNote ?? null,
      actorUserId: a.userId,
      actorOrganizationId: a.organizationId,
      allowRestrictedCommerceForBackoffice: override.allowRestrictedCommerceForBackoffice,
    });
  }

  @Post(":cartId/review")
  @UseGuards(RelationalCartParticipantGuard)
  review(
    @Param("cartId", ParseUUIDPipe) cartId: string,
    @Req() req: VenextHttpLike & { [VENEXT_COMMERCE_THREAD_ACTOR_KEY]?: CommerceThreadResolvedActor },
  ) {
    const a = req[VENEXT_COMMERCE_THREAD_ACTOR_KEY]!;
    return this.carts.reviewCart(cartId, a.userId, a.organizationId);
  }

  @Post(":cartId/confirm-buyer")
  @UseGuards(RelationalCartParticipantGuard)
  confirmBuyer(
    @Param("cartId", ParseUUIDPipe) cartId: string,
    @Req() req: VenextHttpLike & { [VENEXT_COMMERCE_THREAD_ACTOR_KEY]?: CommerceThreadResolvedActor },
  ) {
    const a = req[VENEXT_COMMERCE_THREAD_ACTOR_KEY]!;
    return this.carts.confirmCartBuyer(cartId, a.userId, a.organizationId);
  }

  @Post(":cartId/confirm-seller")
  @UseGuards(RelationalCartParticipantGuard)
  confirmSeller(
    @Param("cartId", ParseUUIDPipe) cartId: string,
    @Req() req: VenextHttpLike & { [VENEXT_COMMERCE_THREAD_ACTOR_KEY]?: CommerceThreadResolvedActor },
  ) {
    const a = req[VENEXT_COMMERCE_THREAD_ACTOR_KEY]!;
    return this.carts.confirmCartSeller(cartId, a.userId, a.organizationId);
  }

  @Post(":cartId/lock")
  @UseGuards(RelationalCartParticipantGuard)
  lock(
    @Param("cartId", ParseUUIDPipe) cartId: string,
    @Req() req: VenextHttpLike & { [VENEXT_COMMERCE_THREAD_ACTOR_KEY]?: CommerceThreadResolvedActor },
  ) {
    const a = req[VENEXT_COMMERCE_THREAD_ACTOR_KEY]!;
    return this.carts.lockCartForOrder(cartId, a.userId, a.organizationId);
  }

  @Post(":cartId/convert-to-order")
  @UseGuards(RelationalCartParticipantGuard)
  convert(
    @Param("cartId", ParseUUIDPipe) cartId: string,
    @Req() req: VenextHttpLike & { [VENEXT_COMMERCE_THREAD_ACTOR_KEY]?: CommerceThreadResolvedActor },
    @Body() body: { allowRestrictedCommerceForBackoffice?: boolean; conversionAttemptId?: string },
  ) {
    const a = req[VENEXT_COMMERCE_THREAD_ACTOR_KEY]!;
    const venextActor = parseVenextActorFromRequest(req);
    const override = resolveBackofficeCartOverride(venextActor, req, body?.allowRestrictedCommerceForBackoffice);
    return this.conversion.convertCartToOrder(cartId, a.userId, a.organizationId, {
      allowRestrictedCommerceForBackoffice: override.allowRestrictedCommerceForBackoffice,
      backofficeOverrideDiagnostics: override.diagnostics,
      conversionAttemptId: body?.conversionAttemptId,
    });
  }

  @Post(":cartId/reject")
  @UseGuards(RelationalCartParticipantGuard)
  reject(
    @Param("cartId", ParseUUIDPipe) cartId: string,
    @Req() req: VenextHttpLike & { [VENEXT_COMMERCE_THREAD_ACTOR_KEY]?: CommerceThreadResolvedActor },
    @Body() body: { reason?: string | null },
  ) {
    const a = req[VENEXT_COMMERCE_THREAD_ACTOR_KEY]!;
    return this.carts.rejectCart(cartId, a.userId, a.organizationId, body?.reason);
  }

  @Post(":cartId/expire")
  @UseGuards(RelationalCartParticipantGuard)
  expire(
    @Param("cartId", ParseUUIDPipe) cartId: string,
    @Req() req: VenextHttpLike & { [VENEXT_COMMERCE_THREAD_ACTOR_KEY]?: CommerceThreadResolvedActor },
  ) {
    const a = req[VENEXT_COMMERCE_THREAD_ACTOR_KEY]!;
    return this.carts.expireCart(cartId, a.userId, a.organizationId);
  }
}
