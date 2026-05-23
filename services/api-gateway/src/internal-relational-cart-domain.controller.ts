import { BadRequestException, Body, Controller, Headers, Post, UnauthorizedException } from "@nestjs/common";
import { isRelationalCartRealtimeEventType, RelationalCartRealtimeSchema } from "@venext/shared-contracts";

import { RealtimeEconomicSignalGateway } from "./realtime/realtime-economic-signal.gateway";

@Controller()
export class InternalRelationalCartDomainController {
  constructor(private readonly gateway: RealtimeEconomicSignalGateway) {}

  @Post("internal/v1/realtime/relational-cart/domain-signal")
  ingest(
    @Headers("x-venext-internal-key") key: string | undefined,
    @Body()
    body: {
      organizationId: string;
      eventType: string;
      source: string;
      body?: Record<string, unknown>;
    },
  ) {
    const expect = process.env.VENEXT_INTERNAL_REALTIME_KEY?.trim();
    if (!expect || key !== expect) {
      throw new UnauthorizedException();
    }
    const et = body.eventType;
    if (typeof et !== "string" || !et.startsWith("relational.cart.")) {
      throw new BadRequestException({ code: "relational_cart_realtime_invalid_event_domain" });
    }
    if (!isRelationalCartRealtimeEventType(et)) {
      throw new BadRequestException({ code: "relational_cart_realtime_unknown_event" });
    }
    const parsed = RelationalCartRealtimeSchema.safeParse(body.body ?? {});
    if (!parsed.success) {
      throw new BadRequestException({ code: "relational_cart_realtime_invalid" });
    }
    this.gateway.ingestRelationalCartDomainSignal(body);
    return { ok: true };
  }
}
