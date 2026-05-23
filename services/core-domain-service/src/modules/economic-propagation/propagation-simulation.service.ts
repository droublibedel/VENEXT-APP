import { BadRequestException, Injectable } from "@nestjs/common";
import { NegotiationStatus, PaymentStatus, ShipmentStatus, WalletStatus } from "@prisma/client";
import type { EconomicShock, PropagationSimulation } from "@venext/shared-contracts";
import { SUPPORTED_SIMULATION_TRIGGERS } from "./economic-propagation-simulation-query";
import { CrossPoleImpactService } from "./cross-pole-impact.service";
import { normalizeTerritoryLabel, territoryNormalizedCodeFromOrg } from "../supply-logistics-intelligence/territory-code-normalizer";
import type { EconomicPropagationSnapshot } from "./economic-propagation-engine.service";
import { EconomicShockService } from "./economic-shock.service";
import { PropagationRuleEngineService } from "./propagation-rule-engine.service";
import { TerritoryFragilityService } from "./territory-fragility.service";

function sevMul(sev?: string): number {
  if (sev === "CRITICAL") return 1.18;
  if (sev === "HIGH") return 1.08;
  if (sev === "LOW") return 0.92;
  return 1;
}

@Injectable()
export class PropagationSimulationService {
  constructor(
    private readonly shocks: EconomicShockService,
    private readonly rules: PropagationRuleEngineService,
    private readonly territory: TerritoryFragilityService,
    private readonly cross: CrossPoleImpactService,
  ) {}

  disabledPreview(organizationId: string, generatedAt: string): PropagationSimulation {
    return {
      simulationId: `sim-disabled-${organizationId.slice(0, 8)}`,
      triggerType: "propagation_simulation_disabled",
      estimatedImpacts: [],
      predictedEscalation:
        "Counterfactual sequencing is off — enable propagation_simulation_enabled to project escalation paths from the live cross-pole snapshot.",
      systemicRiskScore: 0,
      affectedPoles: [],
      affectedTerritories: [],
      mitigationRecommendations: ["Enable propagation_simulation_enabled for scenario fan-out on the same snapshot lattice."],
    };
  }

  previewFromSnapshot(snap: EconomicPropagationSnapshot): PropagationSimulation {
    const detected = this.shocks.detect(snap);
    const head = detected[0] ?? this.syntheticAnchorShock(snap, "shipment_delayed");
    return this.materialize(snap, head, head.type);
  }

  run(
    snap: EconomicPropagationSnapshot,
    opts: { triggerType: string; territory?: string; severity?: EconomicShock["severity"] },
  ): PropagationSimulation {
    const t = opts.triggerType.trim();
    if (!SUPPORTED_SIMULATION_TRIGGERS.has(t)) throw new BadRequestException({ code: "economic_propagation_unknown_trigger", triggerType: t });
    const shock = this.syntheticAnchorShock(snap, t, opts.territory, opts.severity);
    return this.materialize(snap, shock, t);
  }

  private materialize(snap: EconomicPropagationSnapshot, shock: EconomicShock, triggerLabel: string): PropagationSimulation {
    const rawImpacts = this.rules.evaluateImpact(shock, snap).map((i) => ({
      ...i,
      intensity: this.cross.amplifiedIntensity(snap, i.intensity),
    }));
    const frag = this.territory.build(snap, [shock]);
    const mit = this.cross.mitigationDirections(snap, rawImpacts).map((m) => `${m.direction}: ${m.rationale}`);
    const poles = this.cross.impactedPolesFrom(rawImpacts);
    const terr = [...new Set([...shock.affectedTerritories, ...rawImpacts.flatMap((i) => i.affectedTerritories), ...frag.slice(0, 4).map((f) => f.territory)])].filter(Boolean);
    const topFrag = frag[0]?.fragilityScore ?? 0;
    const systemicRiskScore = Number(
      Math.min(1, shock.systemicRisk * 0.55 + rawImpacts.reduce((m, i) => Math.max(m, i.intensity), 0) * 0.35 + topFrag * 0.1).toFixed(3),
    );
    return {
      simulationId: `sim-${snap.organizationId.slice(0, 8)}-${triggerLabel}`,
      triggerType: triggerLabel,
      estimatedImpacts: rawImpacts,
      predictedEscalation: `From ${shock.sourcePole} shock (${shock.type}) intensity ${shock.systemicRisk.toFixed(2)} → ${poles.length} pole(s) absorb delayed energy; top territory fragility ${topFrag.toFixed(2)}.`,
      systemicRiskScore,
      affectedPoles: poles,
      affectedTerritories: terr.slice(0, 16),
      mitigationRecommendations: mit.slice(0, 8),
    };
  }

  private syntheticAnchorShock(
    snap: EconomicPropagationSnapshot,
    trigger: string,
    territoryFilter?: string,
    severity?: EconomicShock["severity"],
  ): EconomicShock {
    const createdAt = snap.generatedAt;
    const org = snap.organizationId;
    const unpaid = snap.finance.orders.filter((o) => o.paymentStatus === PaymentStatus.UNPAID);
    const unpaidRatio = snap.finance.orders.length > 0 ? unpaid.length / snap.finance.orders.length : 0;
    const delayed = snap.supply.shipments.filter((s) => s.shipmentStatus === ShipmentStatus.DELAYED).length;
    const blocked = snap.supply.shipments.filter((s) => s.shipmentStatus === ShipmentStatus.BLOCKED).length;
    const rel = snap.commercial.relationships.length;
    const adv = snap.orderAdv.orders.length;
    const openNeg = snap.orderAdv.negotiations.filter((n) => n.status === NegotiationStatus.OPEN || n.status === NegotiationStatus.PROPOSED).length;
    const nonTerminal =
      snap.supply.shipments.length > 0
        ? snap.supply.shipments.filter((s) => s.shipmentStatus !== ShipmentStatus.DELIVERED).length / snap.supply.shipments.length
        : 0;

    let systemic = 0.35;
    let confidence = 0.55;
    let sourcePole = "supply_logistics";
    let sourceEntityType = "synthetic_trigger";
    const sourceSignals: string[] = [`simulation.trigger:${trigger}`, `finance.orders.unpaidRatio:${unpaidRatio.toFixed(3)}`];

    switch (trigger) {
      case "shipment_delayed":
        systemic = Number(Math.min(1, delayed * 0.09 + blocked * 0.11 + nonTerminal * 0.5).toFixed(3));
        confidence = Number(Math.min(1, 0.52 + nonTerminal * 0.2).toFixed(3));
        sourcePole = "supply_logistics";
        sourceSignals.push(`supply.shipments.delayedCount:${delayed}`, `supply.shipments.nonTerminalShare:${nonTerminal.toFixed(3)}`);
        break;
      case "liquidity_collapse":
        systemic = Number(
          Math.min(1, unpaidRatio * 0.95 + (snap.finance.wallets.some((w) => w.status === WalletStatus.LIMITED) ? 0.18 : 0)).toFixed(3),
        );
        sourcePole = "finance_collections";
        sourceSignals.push(`finance.wallets.limited:${snap.finance.wallets.some((w) => w.status === WalletStatus.LIMITED)}`);
        break;
      case "territory_overheating":
        systemic = Number(Math.min(1, unpaidRatio * 0.75 + snap.orderAdv.orders.length * 0.004).toFixed(3));
        sourcePole = "finance_collections";
        sourceEntityType = "territory_receivable_mass";
        sourceSignals.push(`orderAdv.orders.count:${snap.orderAdv.orders.length}`);
        break;
      case "network_saturation":
        systemic = Number(Math.min(1, Math.log10(rel + adv + 3) / 2.6).toFixed(3));
        sourcePole = "commercial_network";
        sourceEntityType = "graph_density";
        sourceSignals.push(`commercial.relationships.count:${rel}`, `orderAdv.orders.count:${adv}`);
        break;
      case "payment_instability":
        systemic = Number(Math.min(1, unpaidRatio * 1.05).toFixed(3));
        sourcePole = "finance_collections";
        sourceEntityType = "payment_status_mix";
        sourceSignals.push(`finance.orders.unpaidCount:${unpaid.length}`);
        break;
      case "distribution_fragility":
        systemic = Number(Math.min(1, nonTerminal * 0.55 + snap.supply.orders.length * 0.006).toFixed(3));
        sourcePole = "supply_logistics";
        sourceEntityType = "distribution_window";
        sourceSignals.push(`supply.orders.count:${snap.supply.orders.length}`);
        break;
      default:
        break;
    }

    systemic = Number(Math.min(1, systemic * sevMul(severity)).toFixed(3));

    let affectedTerritories: string[] = [];
    if (territoryFilter?.trim()) {
      const code = normalizeTerritoryLabel(territoryFilter.trim()).normalizedCode;
      if (code !== "UNKNOWN") affectedTerritories = [code];
    }
    if (affectedTerritories.length === 0) {
      affectedTerritories = unpaid.slice(0, 4).map((o) => territoryNormalizedCodeFromOrg(o.buyer.city, o.buyer.country));
    }

    const affectedPoles =
      trigger === "network_saturation"
        ? ["commercial_network", "order_adv", "supply_logistics"]
        : trigger === "liquidity_collapse" || trigger === "payment_instability" || trigger === "territory_overheating"
          ? ["finance_collections", "order_adv", "commercial_network"]
          : ["supply_logistics", "order_adv", "finance_collections"];

    const shock: EconomicShock = {
      id: `sim-anchor-${trigger}-${org.slice(0, 8)}`,
      type: trigger,
      sourcePole,
      sourceEntityType,
      severity: severity ?? (systemic >= 0.65 ? "HIGH" : systemic >= 0.4 ? "MODERATE" : "LOW"),
      confidence,
      affectedPoles,
      affectedTerritories: [...new Set(affectedTerritories)].filter(Boolean),
      systemicRisk: systemic,
      sourceSignals,
      explanation: `Synthetic anchor for ${trigger} — coefficients fed only from cross-pole snapshot fields (no RNG). openNeg:${openNeg}`,
      createdAt,
    };
    return shock;
  }
}
