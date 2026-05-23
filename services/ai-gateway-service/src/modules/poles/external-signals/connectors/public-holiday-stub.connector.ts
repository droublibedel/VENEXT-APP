import { Injectable } from "@nestjs/common";
import type { ExternalSignalConnector } from "../external-signal-connector.interface";
import type {
  ExternalSignalFetchContext,
  ExternalSignalSnapshot,
} from "../external-signal.types";

@Injectable()
export class PublicHolidayStubConnector implements ExternalSignalConnector {
  readonly id = "public_holiday_stub_v1";
  readonly kind = "public_holiday" as const;

  async fetch(ctx: ExternalSignalFetchContext): Promise<ExternalSignalSnapshot[]> {
    return [
      {
        kind: "public_holiday",
        providerId: this.id,
        zoneHint: ctx.zoneCode,
        summary:
          "Stub: regional holiday cluster — reduced logistics throughput, ADV clearance backlog risk +8% (mock).",
        confidence: 0.49,
      },
    ];
  }
}
