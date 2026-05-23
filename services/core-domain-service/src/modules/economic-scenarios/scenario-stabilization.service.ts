import { Injectable } from "@nestjs/common";
import type { EconomicPropagationBundle, ScenarioStabilizationProposal } from "@venext/shared-contracts";
import type { GeneratedScenarioCore } from "./scenario-generation.service";

@Injectable()
export class ScenarioStabilizationService {
  propose(core: GeneratedScenarioCore, bundle: EconomicPropagationBundle): ScenarioStabilizationProposal {
    const directions = [
      {
        code: "logistics_throttle",
        label: "Reduce logistics overload posture",
        expectedEffect: "Lower synthetic propagation acceleration on supply-adjacent poles.",
        estimatedConfidence: 0.52,
      },
      {
        code: "marketing_cadence",
        label: "Slow marketing stimulation cadence",
        expectedEffect: "Dampen activationExposure-driven overheating path in projection lattice.",
        estimatedConfidence: 0.48,
      },
      {
        code: "distributor_mesh",
        label: "Reinforce distributor relationship mesh",
        expectedEffect: "Reduce fragmentation stress on commercial_network pole in heuristic model.",
        estimatedConfidence: 0.44,
      },
      {
        code: "liquidity_buffer",
        label: "Protect liquidity buffer lanes",
        expectedEffect: "Shift finance_collections coupling intensity down in symbolic risk view.",
        estimatedConfidence: 0.5,
      },
      {
        code: "territory_isolation",
        label: "Isolate chronically fragile territories in supervision",
        expectedEffect: `Focus on ${bundle.territoryFragility[0]?.territory ?? "top fragility row"} without GIS lock-in.`,
        estimatedConfidence: 0.41,
      },
      {
        code: "hub_priority",
        label: "Prioritize critical hubs in fulfillment planning",
        expectedEffect: "Reduce supplyBreakRisk component when supply shocks dominate scenario.",
        estimatedConfidence: 0.46,
      },
    ];
    if (core.scenarioType.includes("payment") || core.scenarioType.includes("liquidity")) {
      directions[2]!.estimatedConfidence = 0.35;
    }
    return {
      stabilizationDirections: directions.map((d) => ({
        ...d,
        estimatedConfidence: Number(Math.min(0.85, d.estimatedConfidence + core.stabilizationProbability * 0.08).toFixed(3)),
      })),
      note: "Directions are supervisory heuristics only — no automatic execution, not ERP workflows.",
    };
  }
}
