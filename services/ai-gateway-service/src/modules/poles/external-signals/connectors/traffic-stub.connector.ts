import { Injectable } from "@nestjs/common";
import type { ExternalSignalConnector } from "../external-signal-connector.interface";
import type {
  ExternalSignalFetchContext,
  ExternalSignalSnapshot,
} from "../external-signal.types";

@Injectable()
export class TrafficStubConnector implements ExternalSignalConnector {
  readonly id = "traffic_stub_v1";
  readonly kind = "traffic" as const;

  async fetch(ctx: ExternalSignalFetchContext): Promise<ExternalSignalSnapshot[]> {
    return [
      {
        kind: "traffic",
        providerId: this.id,
        zoneHint: ctx.zoneCode ?? "SN-DKR-01",
        summary:
          "Stub: ring congestion index 0.41 — ETA risk +9m on southern arterial (mock).",
        confidence: 0.51,
      },
    ];
  }
}
