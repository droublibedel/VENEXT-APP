import { Injectable } from "@nestjs/common";
import type { ExternalSignalConnector } from "../external-signal-connector.interface";
import type {
  ExternalSignalFetchContext,
  ExternalSignalSnapshot,
} from "../external-signal.types";

@Injectable()
export class CalendarStubConnector implements ExternalSignalConnector {
  readonly id = "calendar_stub_v1";
  readonly kind = "calendar" as const;

  async fetch(ctx: ExternalSignalFetchContext): Promise<ExternalSignalSnapshot[]> {
    return [
      {
        kind: "calendar",
        providerId: this.id,
        zoneHint: ctx.zoneCode,
        summary:
          "Stub: business-week rhythm — mid-week ADV clearance velocity historically +14% Tue–Wed vs Mon baseline (mock).",
        confidence: 0.52,
      },
    ];
  }
}
