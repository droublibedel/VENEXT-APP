import { Injectable, Logger } from "@nestjs/common";

import { DomainRealtimeFanoutClient } from "../domain-realtime/domain-realtime-fanout.client";
import { CanonicalFeatureFlagEvaluator } from "../../feature-flags/canonical-feature-flag.evaluator";
import type { RelationalCartRealtimeDto, RelationalCartRealtimeEventType } from "@venext/shared-contracts";

@Injectable()
export class RelationalCartRealtimePublishService {
  private readonly log = new Logger(RelationalCartRealtimePublishService.name);

  constructor(
    private readonly fanout: DomainRealtimeFanoutClient,
    private readonly flags: CanonicalFeatureFlagEvaluator,
  ) {}

  async publish(organizationId: string, eventType: RelationalCartRealtimeEventType, body: RelationalCartRealtimeDto): Promise<void> {
    const on =
      eventType === "relational.cart.catalog_item_added"
        ? await this.flags.isEnabled("relational_cart_direct_catalog_realtime_enabled", { organizationId })
        : await this.flags.isEnabled("relational_cart_realtime_enabled", { organizationId });
    if (!on || !this.fanout.isConfigured()) return;
    void this.fanout
      .postDomainSignal("/internal/v1/realtime/relational-cart/domain-signal", {
        organizationId,
        eventType,
        source: "RELATIONAL_CART_20_5",
        body,
      })
      .catch((e) => this.log.warn(`relational cart fanout: ${String((e as Error).message)}`));
  }
}
