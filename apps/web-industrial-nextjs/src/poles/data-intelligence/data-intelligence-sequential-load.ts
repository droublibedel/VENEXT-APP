export const DATA_INTEL_CRITICAL = ["/overview", "/ontology", "/correlations", "/anomalies", "/briefing"] as const;

export const DATA_INTEL_EXTENDED = [
  "/predictive-signals",
  "/territory-intelligence",
  "/graph-intelligence",
  "/decision-simulation",
  "/economic-score",
  "/data-quality",
  "/interventions",
] as const;

export type DataIntelBundleKey =
  | "overview"
  | "ontology"
  | "correlations"
  | "anomalies"
  | "briefing"
  | "predictiveSignals"
  | "territoryIntelligence"
  | "graphIntelligence"
  | "decisionSimulation"
  | "economicScore"
  | "dataQuality"
  | "interventions";

const MAP: Record<string, DataIntelBundleKey> = {
  "/overview": "overview",
  "/ontology": "ontology",
  "/correlations": "correlations",
  "/anomalies": "anomalies",
  "/briefing": "briefing",
  "/predictive-signals": "predictiveSignals",
  "/territory-intelligence": "territoryIntelligence",
  "/graph-intelligence": "graphIntelligence",
  "/decision-simulation": "decisionSimulation",
  "/economic-score": "economicScore",
  "/data-quality": "dataQuality",
  "/interventions": "interventions",
};

export type DataIntelPartialBundle = Partial<Record<DataIntelBundleKey, unknown>>;

export async function loadDataIntelligenceSequential(
  fetchPanel: (suffix: string) => Promise<unknown | null>,
): Promise<{ partial: DataIntelPartialBundle; loadOrder: string[] }> {
  const partial: DataIntelPartialBundle = {};
  const loadOrder: string[] = [];
  for (const suffix of DATA_INTEL_CRITICAL) {
    const data = await fetchPanel(suffix);
    const k = MAP[suffix];
    if (k) partial[k] = data ?? undefined;
    loadOrder.push(suffix);
  }
  for (const suffix of DATA_INTEL_EXTENDED) {
    const data = await fetchPanel(suffix);
    const k = MAP[suffix];
    if (k) partial[k] = data ?? undefined;
    loadOrder.push(suffix);
  }
  return { partial, loadOrder };
}
