import { Injectable } from "@nestjs/common";
import type { ExternalSignalSnapshot } from "./external-signals/external-signal.types";
import { PoleAiContextService } from "./pole-ai-context.service";

export type PoleInsightInputs = {
  internalSignals?: { type: string; intensity?: number; zone?: string }[];
  economicEvents?: { label: string; weight: number }[];
  orders?: { pending: number; blocked: number };
  stockMovement?: { sku: string; tension: number }[];
  weather?: string[];
  calendar?: string[];
  relationshipActivity?: { delta: number };
};

export type PoleInsightBundle = {
  provider: "mock-pole-insight-generator";
  poleSlug: string;
  strategicSummary: string;
  operationalWarnings: string[];
  opportunitySignals: string[];
  recommendations: string[];
  forecastIndicators: { label: string; horizon: string; confidence: number }[];
  externalSignalsUsed: ExternalSignalSnapshot[];
};

@Injectable()
export class MockPoleInsightGenerator {
  constructor(private readonly voice: PoleAiContextService) {}

  async generate(
    poleSlug: string,
    inputs: PoleInsightInputs,
    external: ExternalSignalSnapshot[],
  ): Promise<PoleInsightBundle> {
    const v = this.voice.getVoice(poleSlug);
    const tensionMax = Math.max(
      0,
      ...(inputs.stockMovement?.map((s) => s.tension) ?? [0]),
    );
    const pending = inputs.orders?.pending ?? 0;
    const blocked = inputs.orders?.blocked ?? 0;
    const relDelta = inputs.relationshipActivity?.delta ?? 0;

    const strategicSummary = this.buildStrategicSummary(
      poleSlug,
      v.preamble,
      tensionMax,
      pending,
      blocked,
      relDelta,
      external,
    );

    const operationalWarnings = this.buildWarnings(
      tensionMax,
      blocked,
      pending,
      external,
      poleSlug,
    );

    const opportunitySignals = this.buildOpportunities(poleSlug, v.vocabulary, external);

    const recommendations = this.buildRecommendations(poleSlug, tensionMax, blocked);

    const forecastIndicators = this.buildForecasts(poleSlug, tensionMax);

    return {
      provider: "mock-pole-insight-generator",
      poleSlug,
      strategicSummary,
      operationalWarnings,
      opportunitySignals,
      recommendations,
      forecastIndicators,
      externalSignalsUsed: external,
    };
  }

  private buildStrategicSummary(
    poleSlug: string,
    preamble: string,
    tensionMax: number,
    pending: number,
    blocked: number,
    relDelta: number,
    external: ExternalSignalSnapshot[],
  ): string {
    const extDigest = external
      .slice(0, 4)
      .map((e) => `${e.kind}:${e.confidence.toFixed(2)}`)
      .join(" · ");
    const base = `${preamble.slice(0, 96)}…`;
    switch (poleSlug) {
      case "supply-logistics":
        return `${base} | Convoy theatre: tension_peak=${tensionMax.toFixed(2)}; route risk inferred from dwell + ETA skew (mock). Ext: ${extDigest || "—"}.`;
      case "marketing-activation":
        return `${base} | Diffusion field: attention proxies stable; calendar/weather overlays=${external.length} (mock).`;
      case "finance-collections":
        return `${base} | Liquidity surface: order pressure pending=${pending} blocked=${blocked}; relationship delta=${relDelta.toFixed(2)} (mock).`;
      case "direction-strategy":
        return `${base} | Macro corridor: demand ridge vs partner expansion vectors — ${extDigest || "no ext block"} (mock).`;
      case "commercial-network":
        return `${base} | Graph health: relationship activity delta=${relDelta.toFixed(2)}; void scan recommended (mock).`;
      case "orders-adv":
        return `${base} | Order-flow: pending=${pending} blocked=${blocked} — negotiation heat vs fulfillment coupling (mock).`;
      case "data-intelligence":
        return `${base} | Correlation pass: internal=${tensionMax.toFixed(2)}; queue_depth=${pending} (mock).`;
      case "industrial-safety":
        return `${base} | Safety envelope: incident proxy intensity=${tensionMax.toFixed(2)}; hydrant/hazard geometry review (mock).`;
      default:
        return `${base} | pole=${poleSlug}; tension=${tensionMax.toFixed(2)}; pending=${pending}; blocked=${blocked}.`;
    }
  }

  private buildWarnings(
    tensionMax: number,
    blocked: number,
    pending: number,
    external: ExternalSignalSnapshot[],
    poleSlug: string,
  ): string[] {
    const operationalWarnings: string[] = [];
    if (tensionMax > 0.65) {
      operationalWarnings.push(
        "Stock rupture risk elevated on at least one SKU cluster (mock).",
      );
    }
    if (blocked > 2) {
      operationalWarnings.push("Order-flow blockage cluster detected — review ADV chokepoints.");
    }
    if (pending > 12 && poleSlug === "orders-adv") {
      operationalWarnings.push("ADV queue depth above comfort band — fulfillment coupling may slip (mock).");
    }
    for (const e of external) {
      if (
        e.kind === "weather" ||
        e.kind === "traffic" ||
        e.kind === "ramadan_window" ||
        e.kind === "public_holiday" ||
        e.kind === "calendar" ||
        e.kind === "geopolitical" ||
        e.kind === "internet_trend"
      ) {
        operationalWarnings.push(`External / ${e.kind}: ${e.summary}`);
      }
    }
    return operationalWarnings.slice(0, 8);
  }

  private buildOpportunities(
    poleSlug: string,
    vocabulary: string[],
    external: ExternalSignalSnapshot[],
  ): string[] {
    const v0 = vocabulary[0] ?? "signal";
    const trend = external.find((e) => e.kind === "internet_trend");
    const core = [
      `Vector: ${v0} alignment opportunity in high-density cells (mock).`,
      "Opportunity: cross-pole pulse — correlate logistics dwell with unpaid mass pockets (mock).",
    ];
    if (poleSlug === "marketing-activation" && trend) {
      core.push(`Trend lift: ${trend.summary.slice(0, 120)}…`);
    }
    if (poleSlug === "finance-collections") {
      core.push("Opportunity: prioritize collection sweeps on zones with rising pressure + stable wallet velocity (mock).");
    }
    return core.slice(0, 4);
  }

  private buildRecommendations(
    poleSlug: string,
    tensionMax: number,
    blocked: number,
  ): string[] {
    const rec: string[] = [];
    switch (poleSlug) {
      case "supply-logistics":
        rec.push("Shift convoy priority to southern arterial if ETA risk persists (mock).");
        rec.push("Stage buffer stock at SN-THIES node if tension stays above 0.6 (mock).");
        break;
      case "marketing-activation":
        rec.push("Advance sponsor slots in zones where engagement cooled but internet trend is rising (mock).");
        rec.push("Defer mass SMS — Ramadan-adjacent evening windows outperform midday (mock).");
        break;
      case "finance-collections":
        rec.push("Tier-B relationships: shorten payment terms on zones with pressure >0.65 (mock).");
        rec.push("Wallet-first nudges for corridors with healthy velocity but unpaid mass (mock).");
        break;
      case "direction-strategy":
        rec.push("Re-weight strategic tension map toward partner expansion voids near demand ridges (mock).");
        break;
      case "commercial-network":
        rec.push("Deploy field verification on inactive voids adjacent to high relationship density (mock).");
        break;
      case "orders-adv":
        rec.push("Unblock ADV threads before fulfillment commits — heat map shows decoupling risk (mock).");
        if (blocked > 0) {
          rec.push("Escalate blocked order cluster to negotiation rail with SLA watch (mock).");
        }
        break;
      case "data-intelligence":
        rec.push("Run anomaly correlation on economic signals vs route anomalies for next 6h window (mock).");
        break;
      case "industrial-safety":
        rec.push("Elevate hydrant proximity layer to HIGH where thermal excursion pattern repeats (mock).");
        break;
      default:
        rec.push("Maintain operational watch — no pole-specific override (mock).");
    }
    if (tensionMax > 0.55 && poleSlug !== "supply-logistics") {
      rec.push("Cross-check logistics ETA risk — stock tension may propagate to orders (mock).");
    }
    return rec.slice(0, 5);
  }

  private buildForecasts(
    poleSlug: string,
    tensionMax: number,
  ): { label: string; horizon: string; confidence: number }[] {
    const bump = tensionMax * 0.08;
    switch (poleSlug) {
      case "finance-collections":
        return [
          { label: "Collection pressure (7d)", horizon: "7d", confidence: 0.5 + bump },
          { label: "Wallet velocity stability", horizon: "14d", confidence: 0.46 },
        ];
      case "data-intelligence":
        return [
          { label: "Anomaly cone (24h)", horizon: "24h", confidence: 0.55 + bump },
          { label: "Forecast projection blend", horizon: "72h", confidence: 0.42 },
        ];
      case "industrial-safety":
        return [
          { label: "Incident risk envelope", horizon: "12h", confidence: 0.48 + bump },
          { label: "Emergency readiness index", horizon: "7d", confidence: 0.51 },
        ];
      default:
        return [
          { label: "Demand cone (48h)", horizon: "48h", confidence: 0.58 + bump },
          { label: "Liquidity / flow pressure index", horizon: "7d", confidence: 0.44 },
        ];
    }
  }
}
