import { Injectable } from "@nestjs/common";
import type { SupplyRiskMatrixResponse, SupplyRiskMatrixRow } from "@venext/shared-contracts";
import { DeliveryStatus, OrderStatus } from "@prisma/client";
import type { SupplyLogisticsRawSnapshot } from "../supply-logistics-intelligence/supply-logistics-data.service";
import { normalizeTerritoryLabel } from "../supply-logistics-intelligence/territory-code-normalizer";

@Injectable()
export class SupplyRiskService {
  build(snapshot: SupplyLogisticsRawSnapshot, enabled: boolean): SupplyRiskMatrixResponse {
    const { organizationId, generatedAt, orders, orgGeo, economicStates } = snapshot;
    if (!enabled) {
      return { generatedAt, organizationId, policy: "DISABLED", rows: [] };
    }

    const rows: SupplyRiskMatrixRow[] = [];
    const failed = orders.filter((o) => o.deliveryStatus === DeliveryStatus.FAILED);
    if (failed.length > 2) {
      const terr = [
        ...new Set(
          failed.map((o) => normalizeTerritoryLabel(orgGeo.get(o.buyerOrganizationId) ?? "unknown").normalizedCode),
        ),
      ]
        .filter((t) => t !== "UNKNOWN")
        .slice(0, 6);
      rows.push({
        id: "risk-delivery-failures",
        severity: failed.length > 6 ? "elevated" : "watch",
        affectedTerritories: terr,
        probableCause: "Clustered delivery failures — corridor or hub execution breakdown.",
        recommendation: "Prioritize route stabilization and hub dispatch sequencing before downstream trust erodes.",
        confidence: 0.71,
        relatedSignals: [`failed_shipments:${failed.length}`],
      });
    }

    const stuck = orders.filter(
      (o) =>
        o.status === OrderStatus.ACCEPTED &&
        o.deliveryStatus === DeliveryStatus.NOT_STARTED &&
        Date.now() - o.updatedAt.getTime() > 72 * 3600000,
    );
    if (stuck.length > 3) {
      const hubNorm = normalizeTerritoryLabel(orgGeo.get(organizationId) ?? "hub").normalizedCode;
      rows.push({
        id: "risk-loading-collapse",
        severity: "elevated",
        affectedTerritories: hubNorm !== "UNKNOWN" ? [hubNorm] : [],
        probableCause: "Loading / dispatch queue saturation — excessive dwell on accepted orders.",
        recommendation: "Supervise dock execution — reduce warehouse pressure before ripple delays.",
        confidence: 0.66,
        relatedSignals: [`stuck_dispatch:${stuck.length}`],
      });
    }

    const highTension = economicStates.filter((e) => e.stockTensionLevel > 0.62);
    if (highTension.length > 4) {
      rows.push({
        id: "risk-inventory-tension",
        severity: "watch",
        affectedTerritories: [],
        probableCause: "Inventory tension spread across SKU economic states — upstream stock flow stress.",
        recommendation: "Rebalance fulfillment commitments with stock reality on high-tension lines.",
        confidence: 0.58,
        relatedSignals: [`high_tension_skus:${highTension.length}`],
      });
    }

    return { generatedAt, organizationId, policy: "ACTIVE", rows };
  }
}
