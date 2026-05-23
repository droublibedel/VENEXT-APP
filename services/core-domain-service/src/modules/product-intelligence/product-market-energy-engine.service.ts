import { Injectable } from "@nestjs/common";
import type { ProductEconomicState } from "@prisma/client";
import { ProductDiscussionSignalsService } from "./product-discussion-signals.service";

export type MarketEnergyPulse = {
  label: string;
  intensity: number;
  horizon: "24h" | "7d" | "30d";
};

export type ProductMarketEnergyDto = {
  productId: string;
  pulses: MarketEnergyPulse[];
  demandHeat: number;
  tensionIndicator: number;
  reorderVelocityHint: string;
  seasonalAccelerationHint: string;
};

/**
 * Synthetic “market energy” — operational feel without social vanity (Instruction 6 §12).
 */
@Injectable()
export class ProductMarketEnergyEngineService {
  constructor(private readonly discussion: ProductDiscussionSignalsService) {}

  async compute(productId: string, state: ProductEconomicState | null): Promise<ProductMarketEnergyDto> {
    const sig = await this.discussion.getSignals(productId);
    const dv = state?.demandVelocity ?? 0;
    const st = state?.stockTensionLevel ?? 0;
    const mi = state?.movementIntensity ?? 0;

    const pulses: MarketEnergyPulse[] = [];
    if (dv > 0.55) {
      pulses.push({ label: "Demand ridge — accélération perceptible", intensity: dv, horizon: "7d" });
    }
    if (st > 0.5) {
      pulses.push({ label: "Tension stock — priorisation logistique", intensity: st, horizon: "24h" });
    }
    if (sig.activeNegotiations > 0) {
      pulses.push({
        label: "Pulse négociation — chaleur commerciale",
        intensity: Math.min(1, 0.35 + sig.activeNegotiations * 0.12),
        horizon: "24h",
      });
    }
    if (mi > 0.45) {
      pulses.push({ label: "Intensité de mouvement réseau", intensity: mi, horizon: "30d" });
    }
    if (pulses.length === 0) {
      pulses.push({ label: "Régime stable — veille économique", intensity: 0.25, horizon: "7d" });
    }

    return {
      productId,
      pulses: pulses.slice(0, 5),
      demandHeat: dv,
      tensionIndicator: st,
      reorderVelocityHint:
        (state?.recentOrderCount ?? 0) > 2
          ? "Réapprovisionnement récurrent détecté sur le corridor relationnel."
          : "Réordonnancement encore épisodique — opportunité de densification.",
      seasonalAccelerationHint:
        "Accélération saisonnière modélisée hors réseaux sociaux (stub météo/calendrier).",
    };
  }
}
