export const ECONOMIC_PROPAGATION_CRITICAL = ["/overview", "/shocks", "/chains"] as const;

export const ECONOMIC_PROPAGATION_EXTENDED = ["/territory-fragility", "/simulation?triggerType=shipment_delayed"] as const;

export type EconomicPropagationBundleKey =
  | "overview"
  | "shocks"
  | "chains"
  | "territoryFragility"
  | "simulationPreview";

const MAP: Record<string, EconomicPropagationBundleKey> = {
  "/overview": "overview",
  "/shocks": "shocks",
  "/chains": "chains",
  "/territory-fragility": "territoryFragility",
  "/simulation?triggerType=shipment_delayed": "simulationPreview",
};

export type EconomicPropagationPartialBundle = Partial<Record<EconomicPropagationBundleKey, unknown>>;

export async function loadEconomicPropagationSequential(
  fetchPanel: (suffix: string) => Promise<unknown | null>,
): Promise<{ partial: EconomicPropagationPartialBundle; loadOrder: string[] }> {
  const partial: EconomicPropagationPartialBundle = {};
  const loadOrder: string[] = [];
  for (const suffix of ECONOMIC_PROPAGATION_CRITICAL) {
    const data = await fetchPanel(suffix);
    const k = MAP[suffix];
    if (k) partial[k] = data ?? undefined;
    loadOrder.push(suffix);
  }
  for (const suffix of ECONOMIC_PROPAGATION_EXTENDED) {
    const data = await fetchPanel(suffix);
    const k = MAP[suffix];
    if (k) partial[k] = data ?? undefined;
    loadOrder.push(suffix);
  }
  return { partial, loadOrder };
}
