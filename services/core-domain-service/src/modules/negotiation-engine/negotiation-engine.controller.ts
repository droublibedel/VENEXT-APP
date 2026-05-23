import { Body, Controller, Param, ParseUUIDPipe, Post, Req, UseGuards } from "@nestjs/common";
import { PaymentMode } from "@prisma/client";

import type { VenextHttpLike } from "../../platform-authz/venext-auth-context";
import type { CommerceThreadResolvedActor } from "../commerce-thread-access/commerce-thread-actor-resolver.service";
import { VENEXT_COMMERCE_THREAD_ACTOR_KEY } from "../commerce-thread-access/commerce-thread-participant.guard";
import { NegotiationParticipantGuard } from "../commerce-thread-access/negotiation-participant.guard";
import { NegotiationEngineService } from "./negotiation-engine.service";
import { NegotiationToCartConverterService } from "./negotiation-to-cart-converter.service";

@Controller("negotiation-engine")
@UseGuards(NegotiationParticipantGuard)
export class NegotiationEngineController {
  constructor(
    private readonly engine: NegotiationEngineService,
    private readonly cart: NegotiationToCartConverterService,
  ) {}

  @Post(":id/propose-price")
  proposePrice(
    @Param("id", ParseUUIDPipe) id: string,
    @Req() req: VenextHttpLike & { [VENEXT_COMMERCE_THREAD_ACTOR_KEY]?: CommerceThreadResolvedActor },
    @Body() body: { unitPrice: number },
  ) {
    const a = req[VENEXT_COMMERCE_THREAD_ACTOR_KEY]!;
    return this.engine.proposePrice(id, a.userId, a.organizationId, body.unitPrice);
  }

  @Post(":id/propose-payment-mode")
  proposePaymentMode(
    @Param("id", ParseUUIDPipe) id: string,
    @Req() req: VenextHttpLike & { [VENEXT_COMMERCE_THREAD_ACTOR_KEY]?: CommerceThreadResolvedActor },
    @Body()
    body: {
      mode: PaymentMode;
      constraints?: Record<string, unknown>;
    },
  ) {
    const a = req[VENEXT_COMMERCE_THREAD_ACTOR_KEY]!;
    return this.engine.proposePaymentMode(id, a.userId, a.organizationId, body.mode, body.constraints);
  }

  @Post(":id/propose-quantity")
  proposeQuantity(
    @Param("id", ParseUUIDPipe) id: string,
    @Req() req: VenextHttpLike & { [VENEXT_COMMERCE_THREAD_ACTOR_KEY]?: CommerceThreadResolvedActor },
    @Body() body: { quantity: number },
  ) {
    const a = req[VENEXT_COMMERCE_THREAD_ACTOR_KEY]!;
    return this.engine.proposeQuantity(id, a.userId, a.organizationId, body.quantity);
  }

  @Post(":id/accept")
  accept(
    @Param("id", ParseUUIDPipe) id: string,
    @Req() req: VenextHttpLike & { [VENEXT_COMMERCE_THREAD_ACTOR_KEY]?: CommerceThreadResolvedActor },
    @Body()
    body: {
      partial?: { quantity?: number; unitPrice?: number };
    },
  ) {
    const a = req[VENEXT_COMMERCE_THREAD_ACTOR_KEY]!;
    return this.engine.accept(id, a.userId, a.organizationId, body.partial);
  }

  @Post(":id/reject")
  reject(
    @Param("id", ParseUUIDPipe) id: string,
    @Req() req: VenextHttpLike & { [VENEXT_COMMERCE_THREAD_ACTOR_KEY]?: CommerceThreadResolvedActor },
    @Body() body: { reason?: string },
  ) {
    const a = req[VENEXT_COMMERCE_THREAD_ACTOR_KEY]!;
    return this.engine.reject(id, a.userId, a.organizationId, body.reason);
  }

  @Post(":id/reservation-intent")
  reservation(
    @Param("id", ParseUUIDPipe) id: string,
    @Req() req: VenextHttpLike & { [VENEXT_COMMERCE_THREAD_ACTOR_KEY]?: CommerceThreadResolvedActor },
    @Body() body: { note?: string },
  ) {
    const a = req[VENEXT_COMMERCE_THREAD_ACTOR_KEY]!;
    return this.engine.reservationIntent(id, a.userId, a.organizationId, body.note);
  }

  @Post(":id/convert-to-cart")
  convert(
    @Param("id", ParseUUIDPipe) id: string,
    @Req() req: VenextHttpLike & { [VENEXT_COMMERCE_THREAD_ACTOR_KEY]?: CommerceThreadResolvedActor },
  ) {
    const a = req[VENEXT_COMMERCE_THREAD_ACTOR_KEY]!;
    return this.cart.convertToCart(id, a.userId, a.organizationId);
  }
}
