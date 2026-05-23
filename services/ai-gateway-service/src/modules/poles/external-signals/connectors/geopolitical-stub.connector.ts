import { Injectable } from "@nestjs/common";
import type { ExternalSignalConnector } from "../external-signal-connector.interface";
import type {
  ExternalSignalFetchContext,
  ExternalSignalSnapshot,
} from "../external-signal.types";

@Injectable()
export class GeopoliticalStubConnector implements ExternalSignalConnector {
  readonly id = "geopolitical_stub_v1";
  readonly kind = "geopolitical" as const;

  async fetch(ctx: ExternalSignalFetchContext): Promise<ExternalSignalSnapshot[]> {
    return [
      {
        kind: "geopolitical",
        providerId: this.id,
        zoneHint: ctx.zoneCode ?? "SN-DKR-01",
        summary:
          "Stub: corridor stability watch — no major disruption flags; maintain contingency buffer on cross-border SKUs (mock).",
        confidence: 0.41,
      },
    ];
  }
}
