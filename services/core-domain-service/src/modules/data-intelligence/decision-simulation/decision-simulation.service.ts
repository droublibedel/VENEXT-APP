import { Injectable } from "@nestjs/common";
import { PaymentStatus, ShipmentStatus, WalletStatus } from "@prisma/client";
import type { DecisionSimulationResponse } from "@venext/shared-contracts";
import type { DataIntelligenceCrossCutSnapshot } from "../data-intelligence-data.service";

/**
 * Instruction 17 — decision simulation from cross-pole snapshot.
 * Finance inputs: unpaid order count + receivable mass (XOF), wallet buffer / LIMITED state (no duplicate finance engines).
 */
@Injectable()
export class DecisionSimulationService {
  build(s: DataIntelligenceCrossCutSnapshot, enabled: boolean, simOn: boolean): DecisionSimulationResponse {
    if (!enabled) {
      return {
        version: "1",
        generatedAt: s.generatedAt,
        organizationId: s.organizationId,
        policy: "DISABLED",
        scenarios: [],
      };
    }
    if (!simOn) {
      return {
        version: "1",
        generatedAt: s.generatedAt,
        organizationId: s.organizationId,
        policy: "DISABLED",
        scenarios: [],
      };
    }

    const unpaidOrders = s.finance.orders.filter((o) => o.paymentStatus === PaymentStatus.UNPAID);
    const unpaid = unpaidOrders.length;
    const unpaidMassXof = unpaidOrders.reduce((sum, o) => sum + Math.max(0, o.totalAmount ?? 0), 0);
    /** 0–1 intensity from open receivable mass on producer snapshot (heuristic cap ~50M XOF). */
    const receivableIntensity = Number(Math.min(1, unpaidMassXof / 50_000_000 + unpaid * 0.04).toFixed(3));

    const walletBalances = s.finance.wallets.map((w) => w.balance);
    const walletSum = walletBalances.reduce((a, b) => a + b, 0);
    const limitedWallet = s.finance.wallets.some((w) => w.status === WalletStatus.LIMITED);
    /** Higher when treasury buffer is thin — accepting order strains settlement runway. */
    const treasuryStrain = Number(
      Math.min(
        1,
        (walletSum <= 0 ? 0.45 : Math.max(0, 1 - Math.min(1, walletSum / 25_000_000))) * 0.55 + (limitedWallet ? 0.18 : 0) + receivableIntensity * 0.35,
      ).toFixed(3),
    );

    const shipRisk = s.supply.shipments.filter((sh) => sh.shipmentStatus !== ShipmentStatus.DELIVERED).length;
    const relStress = s.commercial.relationships.length > 80 ? 0.45 : 0.22;

    const marginPressure = Number(Math.min(1, 0.08 + receivableIntensity * 0.42 + unpaid * 0.025).toFixed(3));
    const liquidityImpact = Number(Math.min(1, 0.12 + treasuryStrain * 0.55 + receivableIntensity * 0.3).toFixed(3));
    const logisticsPressure = Number(Math.min(1, 0.18 + shipRisk * 0.055 + receivableIntensity * 0.12).toFixed(3));
    const riskDelta = Number(Math.min(1, 0.22 + receivableIntensity * 0.38 + treasuryStrain * 0.25).toFixed(3));

    const marginDelta = Number((-0.015 - receivableIntensity * 0.025).toFixed(4));
    const liquidityDelta = Number((0.04 + treasuryStrain * 0.08 + receivableIntensity * 0.05).toFixed(4));

    const acceptOrderSimulation = {
      id: "sim-accept-order",
      decision: "Accept next high-value ADV order on stressed corridor",
      riskDelta,
      marginPressure,
      logisticsPressure,
      networkStress: relStress,
      liquidityImpact,
      tradeoffs: [
        {
          dimension: "margin",
          delta: marginDelta,
          unit: "ratio" as const,
          prescription:
            unpaid > 0 || unpaidMassXof > 0
              ? `Marge nette sous pression (~${(Math.abs(marginDelta) * 100).toFixed(1)} pts) compte tenu de ${unpaid} commande(s) impayée(s) et ${(unpaidMassXof / 1_000_000).toFixed(1)}M XOF d'encours — sécuriser le territoire peut coûter du spread court terme.`
              : "Tu perds ~2% de marge nette sur le lot, mais tu sécurises un territoire stratégique et tu évites une dégradation de confiance en cascade.",
        },
        {
          dimension: "liquidity",
          delta: liquidityDelta,
          unit: "currency_pressure" as const,
          prescription: `Trésorerie: stress ${treasuryStrain.toFixed(2)} (soldes agrégés + état portefeuille) — enchaîne l'encaissement sur le même corridor avant d'empiler les engagements.`,
        },
        {
          dimension: "fulfillment",
          delta: Number((0.07 + shipRisk * 0.02).toFixed(4)),
          unit: "score" as const,
          prescription: "Pression logistique — conditionne l'acceptation à un créneau hub explicite lorsque les exécutions ne sont pas terminées.",
        },
      ],
      headlinePrescription:
        receivableIntensity > 0.35
          ? "Accepter augmente le risque de tension trésorerie / encaissement — séquence les preuves de paiement; refuser protège la liquidité mais peut fragiliser la relation sur le corridor."
          : "Accepter sécurise le territoire et la relation, au prix d'une compression de marge court terme et d'une charge logistique planifiée — refuser expose le corridor concurrentiel.",
    };

    return {
      version: "1",
      generatedAt: s.generatedAt,
      organizationId: s.organizationId,
      policy: "ACTIVE",
      scenarios: [acceptOrderSimulation],
      acceptOrderSimulation,
    };
  }
}
