import { Injectable, Logger } from "@nestjs/common";

/**
 * Probes API gateway health; channel contracts are documented (Instruction 9B/10).
 */
@Injectable()
export class BackofficeSignalMonitoringService {
  private readonly log = new Logger(BackofficeSignalMonitoringService.name);

  async snapshot() {
    const gatewayBase =
      process.env.API_GATEWAY_URL?.trim() || process.env.VENEXT_API_GATEWAY_URL?.trim() || "";
    let gatewayHealth: { ok: boolean; body?: unknown; latencyMs?: number; error?: string } = {
      ok: false,
      error: "API_GATEWAY_URL not configured",
    };
    if (gatewayBase) {
      const t0 = Date.now();
      try {
        const url = `${gatewayBase.replace(/\/$/, "")}/health`;
        const r = await fetch(url, { signal: AbortSignal.timeout(4000) });
        gatewayHealth = {
          ok: r.ok,
          latencyMs: Date.now() - t0,
          body: r.ok ? await r.json().catch(() => ({})) : await r.text().catch(() => ""),
        };
      } catch (e) {
        this.log.warn(`Gateway health probe failed: ${String(e)}`);
        gatewayHealth = { ok: false, error: String(e) };
      }
    }
    return {
      demoChannels: [
        { name: "demo.realtime.economic_signals", kind: "DEMO", description: "Synthetic operational batches" },
        { name: "demo.operational.signal.batch", kind: "DEMO", description: "Demo-only payload type" },
        { name: "demo.commercial.relationship.event", kind: "DEMO", description: "Commercial pole — relationship supervision" },
        { name: "demo.commercial.retailer.pressure", kind: "DEMO", description: "Commercial pole — downstream pressure" },
        { name: "demo.commercial.sponsorship.spike", kind: "DEMO", description: "Commercial pole — sponsorship burst" },
        { name: "demo.marketing.sponsorship.spike", kind: "DEMO", description: "Activation pole — sponsorship pressure" },
        { name: "demo.marketing.activation.burst", kind: "DEMO", description: "Activation pole — stimulation burst" },
        { name: "demo.marketing.momentum.shift", kind: "DEMO", description: "Activation pole — momentum shift" },
        { name: "demo.marketing.retailer.engagement.burst", kind: "DEMO", description: "Activation pole — retailer engagement" },
        { name: "demo.marketing.campaign.pressure", kind: "DEMO", description: "Activation pole — campaign pressure" },
        { name: "demo.order_adv.negotiation.burst", kind: "DEMO", description: "Orders/ADV pole — negotiation burst" },
        { name: "demo.order_adv.group_buying.spike", kind: "DEMO", description: "Orders/ADV pole — grouped buying spike" },
        { name: "demo.order_adv.reservation.pressure", kind: "DEMO", description: "Orders/ADV pole — reservation pressure" },
        { name: "demo.order_adv.delivery.instability", kind: "DEMO", description: "Orders/ADV pole — delivery instability" },
        { name: "demo.order_adv.conversational.commerce", kind: "DEMO", description: "Orders/ADV pole — conversational commerce" },
        { name: "demo.supply_logistics.shipment.instability", kind: "DEMO", description: "Supply/logistics — shipment instability" },
        { name: "demo.supply_logistics.territory.congestion", kind: "DEMO", description: "Supply/logistics — territory congestion" },
        { name: "demo.supply_logistics.route.overload", kind: "DEMO", description: "Supply/logistics — route overload" },
        { name: "demo.supply_logistics.warehouse.saturation", kind: "DEMO", description: "Supply/logistics — warehouse saturation" },
        { name: "demo.supply_logistics.loading.anomaly", kind: "DEMO", description: "Supply/logistics — loading anomaly" },
        { name: "demo.supply_logistics.fulfillment.degradation", kind: "DEMO", description: "Supply/logistics — fulfillment degradation" },
      ],
      liveChannels: [
        { name: "live.economic.signal", kind: "LIVE", description: "Persisted economic/catalog signals" },
        { name: "live.relationship.event", kind: "LIVE", description: "Domain relationship transitions" },
        { name: "live.catalog.visibility.changed", kind: "LIVE", description: "Visibility graph mutations" },
        { name: "live.commercial.relationship.event", kind: "LIVE", description: "Commercial pole — relationship (domain-backed)" },
        { name: "live.commercial.retailer.pressure", kind: "LIVE", description: "Commercial pole — retailer pressure" },
        { name: "live.commercial.sponsorship.spike", kind: "LIVE", description: "Commercial pole — sponsorship spike" },
        { name: "live.marketing.sponsorship.spike", kind: "LIVE", description: "Activation pole — sponsorship spike" },
        { name: "live.marketing.activation.burst", kind: "LIVE", description: "Activation pole — activation burst" },
        { name: "live.marketing.momentum.shift", kind: "LIVE", description: "Activation pole — momentum shift" },
        { name: "live.marketing.retailer.engagement.burst", kind: "LIVE", description: "Activation pole — retailer burst" },
        { name: "live.marketing.campaign.pressure", kind: "LIVE", description: "Activation pole — campaign pressure" },
        { name: "live.order_adv.negotiation.burst", kind: "LIVE", description: "Orders/ADV pole — negotiation burst" },
        { name: "live.order_adv.group_buying.spike", kind: "LIVE", description: "Orders/ADV pole — grouped buying spike" },
        { name: "live.order_adv.reservation.pressure", kind: "LIVE", description: "Orders/ADV pole — reservation pressure" },
        { name: "live.order_adv.delivery.instability", kind: "LIVE", description: "Orders/ADV pole — delivery instability" },
        { name: "live.order_adv.conversational.commerce", kind: "LIVE", description: "Orders/ADV pole — conversational commerce" },
        { name: "live.supply_logistics.shipment.instability", kind: "LIVE", description: "Supply/logistics — shipment instability" },
        { name: "live.supply_logistics.territory.congestion", kind: "LIVE", description: "Supply/logistics — territory congestion" },
        { name: "live.supply_logistics.route.overload", kind: "LIVE", description: "Supply/logistics — route overload" },
        { name: "live.supply_logistics.warehouse.saturation", kind: "LIVE", description: "Supply/logistics — warehouse saturation" },
        { name: "live.supply_logistics.loading.anomaly", kind: "LIVE", description: "Supply/logistics — loading anomaly" },
        { name: "live.supply_logistics.fulfillment.degradation", kind: "LIVE", description: "Supply/logistics — fulfillment degradation" },
      ],
      gatewayHealth,
      connectedClients: null as number | null,
      note: "Client connection counts require gateway instrumentation (future).",
    };
  }
}
