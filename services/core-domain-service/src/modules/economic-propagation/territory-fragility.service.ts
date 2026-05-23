import { Injectable } from "@nestjs/common";
import { PaymentStatus, ShipmentStatus } from "@prisma/client";
import type { EconomicShock, TerritoryFragility } from "@venext/shared-contracts";
import { normalizeTerritoryLabel, territoryNormalizedCodeFromOrg } from "../supply-logistics-intelligence/territory-code-normalizer";
import type { EconomicPropagationSnapshot } from "./economic-propagation-engine.service";

function clamp01(x: number): number {
  return Number(Math.max(0, Math.min(1, x)).toFixed(3));
}

@Injectable()
export class TerritoryFragilityService {
  /**
   * @param shocks optional — used only to detect CRITICAL systemic shock for global-only cap lift (18.1A).
   */
  build(snap: EconomicPropagationSnapshot, shocks?: EconomicShock[]): TerritoryFragility[] {
    const hasCriticalSystemic = Boolean(shocks?.some((s) => s.severity === "CRITICAL"));

    const territoryKeys = new Set<string>();
    for (const g of snap.supply.orgGeo?.values() ?? []) {
      const n = normalizeTerritoryLabel(String(g));
      if (n.normalizedCode !== "UNKNOWN") territoryKeys.add(n.normalizedCode);
    }
    for (const o of snap.finance.orders) {
      territoryKeys.add(territoryNormalizedCodeFromOrg(o.buyer.city, o.buyer.country));
    }
    for (const sig of snap.strategicSummary.territorySignals ?? []) {
      const n = normalizeTerritoryLabel(sig);
      if (n.normalizedCode !== "UNKNOWN") territoryKeys.add(n.normalizedCode);
    }
    for (const sig of snap.marketingSummary.territorySignals ?? []) {
      const n = normalizeTerritoryLabel(sig);
      if (n.normalizedCode !== "UNKNOWN") territoryKeys.add(n.normalizedCode);
    }

    const unpaidOrders = snap.finance.orders.filter((o) => o.paymentStatus === PaymentStatus.UNPAID);
    const totalOrders = Math.max(1, snap.finance.orders.length);
    const unpaidRatioGlobal = unpaidOrders.length / totalOrders;
    const delayedShipments = snap.supply.shipments.filter((s) => s.shipmentStatus === ShipmentStatus.DELAYED).length;
    const blockedShipments = snap.supply.shipments.filter((s) => s.shipmentStatus === ShipmentStatus.BLOCKED).length;
    const shipN = Math.max(1, snap.supply.shipments.length);
    const nonTerminalShare =
      snap.supply.shipments.length > 0
        ? snap.supply.shipments.filter((s) => s.shipmentStatus !== ShipmentStatus.DELIVERED).length / snap.supply.shipments.length
        : 0;
    const lowTrust = snap.commercial.relationships.filter(
      (r) => typeof r.trustLevel === "number" && Number(r.trustLevel) < 0.45,
    ).length;
    const relN = Math.max(1, snap.commercial.relationships.length);
    const openNegFrac =
      snap.negotiationMetrics.totalNegotiationsCount > 0
        ? snap.negotiationMetrics.openNegotiationsCount / snap.negotiationMetrics.totalNegotiationsCount
        : 0;

    const globalSystemicPressure = clamp01(unpaidRatioGlobal * 0.42 + nonTerminalShare * 0.38 + openNegFrac * 0.2);

    const actPress = snap.marketingSummary.available ? snap.marketingSummary.metrics?.territoryStimulation ?? 0 : 0;
    const predHint = snap.dataIntelligence.available
      ? Math.min(1, (snap.dataIntelligence.bundle?.predictiveSignals?.signals?.length ?? 0) / 10 + 0.05)
      : 0;

    const orgGeoSize = snap.supply.orgGeo?.size ?? 0;

    const rows: TerritoryFragility[] = [];

    for (const territory of territoryKeys) {
      const ordersHere = snap.finance.orders.filter(
        (o) => territoryNormalizedCodeFromOrg(o.buyer.city, o.buyer.country) === territory,
      );
      const totalHere = Math.max(1, ordersHere.length);
      const unpaidHere = ordersHere.filter((o) => o.paymentStatus === PaymentStatus.UNPAID).length;
      const localUnpaidRatio = unpaidHere / totalHere;
      const localLiquidityEvidence = clamp01(localUnpaidRatio * 1.05);

      const geoHits = [...(snap.supply.orgGeo?.entries() ?? [])].filter(
        ([, v]) => normalizeTerritoryLabel(String(v)).normalizedCode === territory,
      ).length;

      let localLogisticsEvidence = 0;
      if (geoHits > 0 && orgGeoSize > 0) {
        const geoWeight = Math.min(1, geoHits / orgGeoSize);
        localLogisticsEvidence = clamp01(
          (delayedShipments / shipN) * 0.62 * geoWeight + (blockedShipments / shipN) * 0.38 * geoWeight,
        );
      }

      const relationshipLocalProxy = clamp01(
        unpaidHere > 0 ? Math.min(1, unpaidHere * 0.08 + (lowTrust / relN) * 0.35) : ordersHere.length > 0 ? (lowTrust / relN) * 0.12 : 0,
      );

      const territorySignalHit = snap.marketingSummary.territorySignals.some(
        (t) => normalizeTerritoryLabel(t).normalizedCode === territory,
      );
      let activationGlobalOnly = false;
      let activationLocal = 0;
      if (territorySignalHit && snap.marketingSummary.available) {
        activationLocal = clamp01(actPress * 0.88);
      } else if (snap.marketingSummary.available) {
        activationGlobalOnly = true;
        activationLocal = clamp01(actPress * 0.12);
      }

      const localEvidenceSignals: string[] = [];
      if (unpaidHere > 0) localEvidenceSignals.push(`finance:unpaid_local:${unpaidHere}`);
      if (geoHits > 0) localEvidenceSignals.push(`supply:org_geo_match:${geoHits}`);
      if (territorySignalHit) localEvidenceSignals.push("marketing:territory_signal_match");
      if (activationGlobalOnly) localEvidenceSignals.push("marketing:global_only");

      const localTerritoryEvidence = clamp01(
        0.38 * localLiquidityEvidence + 0.34 * localLogisticsEvidence + 0.2 * relationshipLocalProxy + 0.08 * activationLocal,
      );

      const liquidityExposure = localLiquidityEvidence;
      const logisticsExposure =
        localLogisticsEvidence > 0.02
          ? localLogisticsEvidence
          : clamp01(globalSystemicPressure * 0.08 * (geoHits > 0 ? 0.5 : 0.25));
      const relationshipExposure = relationshipLocalProxy;
      const paymentExposure = localLiquidityEvidence;
      const activationExposure = activationLocal;

      const resilienceScore = clamp01(
        0.55 +
          (snap.strategicSummary.available ? snap.strategicSummary.confidence * 0.25 : 0) -
          predHint * 0.15 -
          logisticsExposure * 0.1,
      );

      let fragilityScore = clamp01(
        localTerritoryEvidence * 0.62 +
          globalSystemicPressure * 0.22 * Math.min(1, 0.25 + localTerritoryEvidence * 2.2) +
          predHint * 0.06 -
          resilienceScore * 0.08,
      );

      if (localTerritoryEvidence < 0.05 && !hasCriticalSystemic) {
        fragilityScore = Math.min(fragilityScore, 0.35);
      }

      rows.push({
        territory,
        globalSystemicPressure,
        localTerritoryEvidence,
        localEvidenceSignals,
        fragilityScore,
        liquidityExposure,
        logisticsExposure,
        relationshipExposure,
        paymentExposure,
        activationExposure,
        resilienceScore,
        explanation: `Territory ${territory}: localEvidence=${localTerritoryEvidence.toFixed(2)} globalPressure=${globalSystemicPressure.toFixed(
          2,
        )} signals=[${localEvidenceSignals.join(",")}] · liquidity=${liquidityExposure.toFixed(2)} logistics=${logisticsExposure.toFixed(
          2,
        )} payment=${paymentExposure.toFixed(2)} activation=${activationExposure.toFixed(2)} vs resilience=${resilienceScore.toFixed(2)}.`,
      });
    }

    return rows.sort((a, b) => b.fragilityScore - a.fragilityScore).slice(0, 32);
  }
}
