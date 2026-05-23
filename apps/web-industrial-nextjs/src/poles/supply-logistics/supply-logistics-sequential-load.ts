export const SUPPLY_CRITICAL = ["/overview", "/briefing", "/risk-matrix", "/interventions"] as const;

export const SUPPLY_EXTENDED = [
  "/territory-flow",
  "/shipment-health",
  "/routes",
  "/warehouse-pressure",
  "/loading-supervision",
  "/delay-radar",
  "/fulfillment-stability",
] as const;

export type SupplyBundleKey =
  | "overview"
  | "briefing"
  | "riskMatrix"
  | "interventions"
  | "territoryFlow"
  | "shipmentHealth"
  | "routes"
  | "warehousePressure"
  | "loadingSupervision"
  | "delayRadar"
  | "fulfillmentStability";

const MAP: Record<string, SupplyBundleKey> = {
  "/overview": "overview",
  "/briefing": "briefing",
  "/risk-matrix": "riskMatrix",
  "/interventions": "interventions",
  "/territory-flow": "territoryFlow",
  "/shipment-health": "shipmentHealth",
  "/routes": "routes",
  "/warehouse-pressure": "warehousePressure",
  "/loading-supervision": "loadingSupervision",
  "/delay-radar": "delayRadar",
  "/fulfillment-stability": "fulfillmentStability",
};

export type SupplyPartialBundle = Partial<Record<SupplyBundleKey, unknown>>;

export async function loadSupplyLogisticsSequential(
  fetchPanel: (suffix: string) => Promise<unknown | null>,
): Promise<{ partial: SupplyPartialBundle; loadOrder: string[] }> {
  const partial: SupplyPartialBundle = {};
  const loadOrder: string[] = [];
  for (const suffix of SUPPLY_CRITICAL) {
    const data = await fetchPanel(suffix);
    const k = MAP[suffix];
    if (k) partial[k] = data ?? undefined;
    loadOrder.push(suffix);
  }
  for (const suffix of SUPPLY_EXTENDED) {
    const data = await fetchPanel(suffix);
    const k = MAP[suffix];
    if (k) partial[k] = data ?? undefined;
    loadOrder.push(suffix);
  }
  return { partial, loadOrder };
}
