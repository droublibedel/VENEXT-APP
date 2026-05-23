import { Injectable } from "@nestjs/common";

import { RelationalCartService } from "../relational-cart/relational-cart.service";

/**
 * Accepted negotiation → relational preparation cart (Instruction 20.5).
 * Relational orders are materialized only via `RelationalCartConversionService`.
 */
@Injectable()
export class NegotiationToCartConverterService {
  constructor(private readonly relationalCart: RelationalCartService) {}

  async convertToCart(negotiationId: string, actorUserId: string, actorOrganizationId: string) {
    return this.relationalCart.createCartFromNegotiation(negotiationId, actorUserId, actorOrganizationId, {
      markNegotiationConverted: true,
    });
  }
}
