export const SUPPLY_LOGISTICS_REALTIME_EVENT_TYPES = [
  "demo.supply_logistics.shipment.instability",
  "demo.supply_logistics.territory.congestion",
  "demo.supply_logistics.route.overload",
  "demo.supply_logistics.warehouse.saturation",
  "demo.supply_logistics.loading.anomaly",
  "demo.supply_logistics.fulfillment.degradation",
  "live.supply_logistics.shipment.instability",
  "live.supply_logistics.territory.congestion",
  "live.supply_logistics.route.overload",
  "live.supply_logistics.warehouse.saturation",
  "live.supply_logistics.loading.anomaly",
  "live.supply_logistics.fulfillment.degradation",
] as const;

export type SupplyLogisticsRealtimeEventType = (typeof SUPPLY_LOGISTICS_REALTIME_EVENT_TYPES)[number];
