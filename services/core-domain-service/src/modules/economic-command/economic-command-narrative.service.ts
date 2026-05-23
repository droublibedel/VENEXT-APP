import { Injectable } from "@nestjs/common";
import type { EconomicCommandNarrative } from "@venext/shared-contracts";

import type { EconomicCommandComposeContext } from "./economic-command.types";

@Injectable()
export class EconomicCommandNarrativeService {
  build(
    ctx: EconomicCommandComposeContext,
    stress: { globalStress: number; dominant: string },
    zoneCount: number,
    riskCount: number,
    arbCount: number,
    tensionCount: number,
  ): EconomicCommandNarrative {
    const lines: string[] = [];
    lines.push(
      `Executive readout (heuristic): systemic stress proxy ${stress.globalStress.toFixed(2)} — ${stress.dominant} leads the blend.`,
    );
    lines.push(
      `Pressure lattice: ${zoneCount} zone(s); arbitration queue: ${arbCount}; advisory risks: ${riskCount}; silent tensions: ${tensionCount}.`,
    );
    lines.push("This cockpit is read-only — no automatic execution on orders, payments, inventory, or CRM.");
    lines.push("Scores are uncalibrated proxies for war-room sequencing; validate with domain leads before commitments.");
    if (ctx.coordinationBundle.policy === "ACTIVE") {
      lines.push(`Coordination posture anchor: ${ctx.coordinationBundle.posture.posture} (symbolic orchestration).`);
    }
    lines.push("Limitations: deterministic v1 heuristics only — not generative AI and not a forecast engine.");

    const narrative: EconomicCommandNarrative = {
      narrativeMode: "HEURISTIC_EXECUTIVE_SUMMARY",
      lines: lines.slice(0, 6),
      dominantPressure: stress.dominant,
      executiveWarning:
        riskCount > 0
          ? "At least one advisory risk is lit — sequence human arbitration before acceleration narratives."
          : "No high-severity advisory risks flagged on this window — maintain watch on logistics and liquidity proxies.",
      recommendedFocus:
        zoneCount > 0
          ? "Prioritize the highest-pressure zone in the left rail and align finance + supply leads in the same thread."
          : "Hold steady monitoring — expand scenario contrast if the lattice looks flat but shocks persist.",
      limitations:
        "Narrative is assembled from existing bundles (18.1–18.4 + DI); thresholds are not production-calibrated; symbolic map is non-geographic.",
    };
    return narrative;
  }
}
