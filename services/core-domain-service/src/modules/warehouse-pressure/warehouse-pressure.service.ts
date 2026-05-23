import { Injectable } from "@nestjs/common";
import type { WarehousePressureResponse, WarehousePressureRow } from "@venext/shared-contracts";
import type { SupplyLogisticsRawSnapshot } from "../supply-logistics-intelligence/supply-logistics-data.service";
import { HubPressureProvider } from "./hub-pressure.provider";

@Injectable()
export class WarehousePressureService {
  build(snapshot: SupplyLogisticsRawSnapshot, enabled: boolean): WarehousePressureResponse {
    const { organizationId, generatedAt } = snapshot;
    if (!enabled) {
      return {
        generatedAt,
        organizationId,
        policy: "DISABLED",
        overloadedHubs: [],
        rows: [],
        moduleNote: "warehouse_pressure_enabled",
      };
    }

    const built = HubPressureProvider.build(snapshot, true);
    const rows: WarehousePressureRow[] = built.map((r) => ({
      hubKey: r.hubKey,
      hubCode: r.hubCode,
      territory: r.territory,
      label: r.label,
      source: r.source,
      queuePressure: r.queuePressure,
      confidence: r.confidence,
      saturation: r.saturation,
      dispatchBottleneck: r.dispatchBottleneck,
      queueInstability: r.queueInstability,
      inventoryPressure: r.inventoryPressure,
      openDispatchCount: r.openDispatchCount,
    }));

    const overloadedHubs = rows.filter((r) => r.saturation > 0.52 || r.queueInstability > 0.45).map((r) => r.hubKey);

    return {
      generatedAt,
      organizationId,
      policy: "ACTIVE",
      overloadedHubs,
      rows,
      moduleNote: "Hub pressure — explicit SHIPMENT_TABLE vs ORDER_PROXY source (Instruction 15A).",
    };
  }
}
