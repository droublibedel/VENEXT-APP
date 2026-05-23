import { Injectable } from "@nestjs/common";
import type { ExternalSignalConnector } from "../external-signal-connector.interface";
import type {
  ExternalSignalFetchContext,
  ExternalSignalSnapshot,
} from "../external-signal.types";

@Injectable()
export class InternetTrendStubConnector implements ExternalSignalConnector {
  readonly id = "internet_trend_stub_v1";
  readonly kind = "internet_trend" as const;

  async fetch(ctx: ExternalSignalFetchContext): Promise<ExternalSignalSnapshot[]> {
    return [
      {
        kind: "internet_trend",
        providerId: this.id,
        zoneHint: ctx.zoneCode,
        summary:
          "Stub: search/social velocity spike on regional beverage SKU cluster — attention gravity +22% vs 7d baseline (mock).",
        confidence: 0.53,
      },
    ];
  }
}
