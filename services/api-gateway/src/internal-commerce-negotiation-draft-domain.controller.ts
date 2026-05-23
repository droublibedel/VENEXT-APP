import { Body, Controller, Headers, Post, UnauthorizedException } from "@nestjs/common";
import { CommerceRealtimeGateway } from "./realtime/commerce-realtime.gateway";

@Controller()
export class InternalCommerceNegotiationDraftDomainController {
  constructor(private readonly commerce: CommerceRealtimeGateway) {}

  @Post("internal/v1/realtime/commerce-negotiation-draft/domain-signal")
  ingest(
    @Headers("x-venext-internal-key") key: string | undefined,
    @Body()
    body: {
      threadId: string;
      organizationId?: string;
      eventType: string;
      source?: string;
      body?: Record<string, unknown>;
    },
  ) {
    const expect = process.env.VENEXT_INTERNAL_REALTIME_KEY?.trim();
    if (!expect || key !== expect) {
      throw new UnauthorizedException();
    }
    this.commerce.publishNegotiationDraftSignal(body.threadId, body.eventType, body.body ?? {});
    return { ok: true };
  }
}
