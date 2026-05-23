import { Injectable } from "@nestjs/common";
import type { ExternalSignalConnector } from "../external-signal-connector.interface";
import type {
  ExternalSignalFetchContext,
  ExternalSignalSnapshot,
} from "../external-signal.types";

@Injectable()
export class RamadanStubConnector implements ExternalSignalConnector {
  readonly id = "ramadan_stub_v1";
  readonly kind = "ramadan_window" as const;

  async fetch(ctx: ExternalSignalFetchContext): Promise<ExternalSignalSnapshot[]> {
    return [
      {
        kind: "ramadan_window",
        providerId: this.id,
        zoneHint: ctx.zoneCode,
        summary:
          "Stub: Ramadan evening window — basket weighting shifts toward staples + beverages after 18:30 local (mock).",
        confidence: 0.58,
      },
    ];
  }
}
