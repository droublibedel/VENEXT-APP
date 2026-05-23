import { Injectable } from "@nestjs/common";
import type { SeasonalPressure } from "@venext/shared-contracts";
import type { CommercialNetworkContext } from "../commercial-network-intelligence/commercial-network-context.service";

/**
 * Instruction 13A — external / seasonal pressure adapter.
 * All outputs are MOCK_CONTEXT until a real external bridge exists.
 */
@Injectable()
export class MarketingExternalSignalAdapter {
  buildSeasonalPressure(ctx: CommercialNetworkContext): SeasonalPressure {
    const baseTerritories = new Set<string>();
    for (const c of ctx.partnersPack.counterparties) {
      baseTerritories.add(`${c.country ?? "?"}/${c.city ?? "?"}`);
    }
    const affected = [...baseTerritories].slice(0, 4);
    const intensity = Number(
      Math.min(0.92, 0.28 + ctx.orders30d.length / 120 + ctx.negotiations30d / 200).toFixed(3),
    );
    return {
      source: "MOCK_CONTEXT:weather_ramadan_holidays_traffic_trends_geopolitical_stub",
      intensity,
      affectedTerritories: affected.length ? affected : ["SN/Dakar"],
      affectedCategories: ["MOCK_CONTEXT:staples", "MOCK_CONTEXT:beverage"],
      confidence: 0.48,
      explanation:
        "MOCK_CONTEXT — fused stub for weather, Ramadan cadence, public holidays, traffic friction, internet trend noise, and geopolitical backdrop. Replace with live external adapters when wired (Instruction 13A).",
    };
  }
}
