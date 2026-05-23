import { Injectable } from "@nestjs/common";
import type { EconomicPropagationBundle, ScenarioImpactRow } from "@venext/shared-contracts";
import type { GeneratedScenarioCore } from "./scenario-generation.service";

@Injectable()
export class ScenarioImpactService {
  buildImpacts(bundle: EconomicPropagationBundle, core: GeneratedScenarioCore): ScenarioImpactRow[] {
    const chainCount = bundle.chains.length;
    const seen = new Set<string>();
    const rows: ScenarioImpactRow[] = [];

    for (const chain of bundle.chains) {
      const shockType = chain.shock.type;
      for (const im of chain.impacts.slice(0, 6)) {
        const dedupeKey = `${chain.chainId}|${im.targetPole}|${im.impactType}`;
        if (seen.has(dedupeKey)) continue;
        seen.add(dedupeKey);
        const baseSignals = [
          `propagation.chain:${chain.chainId}`,
          `propagation.rootShockType:${shockType}`,
          `scenario.type:${core.scenarioType}`,
          ...core.affectedTerritories.slice(0, 2).map((t) => `territory:${t}`),
        ];
        rows.push({
          targetPole: im.targetPole,
          impactKind: `${core.scenarioType}:${im.impactType}`,
          intensity: Number(Math.min(1, im.intensity * (0.85 + core.projectedRisk * 0.15)).toFixed(3)),
          confidence: Number(Math.min(1, im.confidence * core.confidence).toFixed(3)),
          sourceSignals: baseSignals.slice(0, 20),
          chainId: chain.chainId,
          rootShockType: shockType,
          sourceChainCount: chainCount,
          observational: true,
          explanation: `Impact derived from propagation chain ${chain.chainId} (root shock ${shockType}); not a calibrated forecast.`,
        });
      }
    }

    if (rows.length === 0) {
      const explanation =
        "Synthetic fallback impact — no propagation chain impacts available; symbolic projection only (synthetic fallback).";
      for (const p of core.affectedPoles.slice(0, 4)) {
        rows.push({
          targetPole: p,
          impactKind: `${core.scenarioType}:synthetic_cross_pole`,
          intensity: Number((0.25 + core.projectedRisk * 0.35).toFixed(3)),
          confidence: Number(core.confidence.toFixed(3)),
          source: "SYNTHETIC_FALLBACK",
          observational: false,
          explanation,
          sourceChainCount: chainCount,
          sourceSignals: [
            "source:SYNTHETIC_FALLBACK",
            `propagation.shocks:${bundle.shocks.length}`,
            `scenario.type:${core.scenarioType}`,
          ].slice(0, 20),
        });
      }
    }
    return rows.slice(0, 16);
  }
}
