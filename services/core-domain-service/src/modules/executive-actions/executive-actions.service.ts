import { Injectable } from "@nestjs/common";
import { MarketPressureService } from "../market-pressure/market-pressure.service";
import { StrategicRiskService } from "../strategic-risk/strategic-risk.service";
import { StrategicSignalsRadarService } from "../strategic-intelligence/strategic-signals-radar.service";

export type ExecutiveActionType =
  | "investigate_region"
  | "reinforce_wholesaler"
  | "reduce_sponsorship"
  | "increase_allocation"
  | "inspect_territory"
  | "contact_distributor"
  | "monitor_category";

@Injectable()
export class ExecutiveActionsService {
  constructor(
    private readonly pressure: MarketPressureService,
    private readonly risk: StrategicRiskService,
    private readonly radar: StrategicSignalsRadarService,
  ) {}

  async queue(organizationId: string) {
    const [p, r, rad] = await Promise.all([
      this.pressure.snapshot(organizationId),
      this.risk.matrix(organizationId),
      this.radar.radar(organizationId),
    ]);

    const actions: {
      id: string;
      type: ExecutiveActionType;
      urgency: "P1" | "P2" | "P3";
      reason: string;
      impactEstimate: string;
      confidence: number;
      relatedSignals: string[];
    }[] = [];

    if (p.band === "CRITICAL" || p.band === "HIGH") {
      actions.push({
        id: "act-pressure-1",
        type: "inspect_territory",
        urgency: "P1",
        reason: `Market pressure ${p.band}: ${p.drivers[0]?.detail ?? "multi-driver tension"}`,
        impactEstimate: "Avoid wholesale rupture and retailer churn in impacted corridors.",
        confidence: p.confidence,
        relatedSignals: p.drivers.map((d) => d.code),
      });
    }

    const wr = r.risks.find((x) => x.riskType === "WHOLESALER_CONCENTRATION");
    if (wr) {
      actions.push({
        id: "act-risk-wh",
        type: "reinforce_wholesaler",
        urgency: wr.severity === "HIGH" ? "P1" : "P2",
        reason: wr.estimatedImpact,
        impactEstimate: "Reduce single-edge dependency before seasonal spikes.",
        confidence: 0.71,
        relatedSignals: [wr.riskType],
      });
    }

    const rr = r.risks.find((x) => x.riskType === "REGIONAL_OVERDEPENDENCY");
    if (rr) {
      actions.push({
        id: "act-risk-rg",
        type: "investigate_region",
        urgency: "P2",
        reason: rr.estimatedImpact,
        impactEstimate: "Diversify absorption geography to dampen systemic shocks.",
        confidence: 0.66,
        relatedSignals: [rr.riskType],
      });
    }

    if (p.drivers.some((d) => d.code === "SPONSORSHIP_EXPOSURE")) {
      actions.push({
        id: "act-sponsor",
        type: "reduce_sponsorship",
        urgency: "P2",
        reason: "Sponsorship lanes elevated vs baseline — risk of perception saturation.",
        impactEstimate: "Protect sponsor identity integrity and avoid hidden injection patterns.",
        confidence: 0.62,
        relatedSignals: ["SPONSORSHIP_EXPOSURE"],
      });
    }

    const demandExternal = rad.external.find((e) => e.kind === "CALENDAR_RAMADAN" && e.impact === "HIGH");
    if (demandExternal) {
      actions.push({
        id: "act-alloc",
        type: "increase_allocation",
        urgency: "P2",
        reason: `${demandExternal.label} — align upstream fills before retailer tension.`,
        impactEstimate: "Raise fill reliability on staple SKUs in declared territories.",
        confidence: demandExternal.confidence,
        relatedSignals: [demandExternal.kind],
      });
    }

    actions.push({
      id: "act-monitor-cat",
      type: "monitor_category",
      urgency: "P3",
      reason: `Watch categories ${p.impactedProductCategories.slice(0, 3).join(", ") || "core assortment"} against negotiation burst signals.`,
      impactEstimate: "Early stabilization before stock tension cascades.",
      confidence: 0.58,
      relatedSignals: p.drivers.filter((d) => d.code === "NEGOTIATION_SURGE").map((d) => d.code),
    });

    actions.push({
      id: "act-dist",
      type: "contact_distributor",
      urgency: "P3",
      reason: "Maintain distributor comms where message velocity elevated.",
      impactEstimate: "Reduce asynchronous drift between field reality and allocation.",
      confidence: 0.55,
      relatedSignals: ["MESSAGE_VELOCITY"],
    });

    return {
      generatedAt: new Date().toISOString(),
      actions: actions.slice(0, 14),
    };
  }
}
