import { Body, Controller, Headers, Post, UnauthorizedException } from "@nestjs/common";
import { RealtimeEconomicSignalGateway } from "./realtime/realtime-economic-signal.gateway";

@Controller()
export class InternalSupplyLogisticsDomainController {
  constructor(private readonly gateway: RealtimeEconomicSignalGateway) {}

  @Post("internal/v1/realtime/supply-logistics/domain-signal")
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
    this.gateway.ingestSupplyLogisticsDomainSignal(body);
    return { ok: true };
  }
}
