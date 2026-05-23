import { Injectable } from "@nestjs/common";
import type { ExternalSignalConnector } from "../external-signal-connector.interface";
import type {
  ExternalSignalFetchContext,
  ExternalSignalSnapshot,
} from "../external-signal.types";

@Injectable()
export class WeatherStubConnector implements ExternalSignalConnector {
  readonly id = "weather_stub_v1";
  readonly kind = "weather" as const;

  async fetch(ctx: ExternalSignalFetchContext): Promise<ExternalSignalSnapshot[]> {
    return [
      {
        kind: "weather",
        providerId: this.id,
        zoneHint: ctx.zoneCode ?? "SN-THIES",
        summary:
          "Stub: sustained trade-wind pattern — inland corridors stable for convoys.",
        confidence: 0.62,
      },
    ];
  }
}
