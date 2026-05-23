"use client";

import type { DataIntelligenceBundleResponse } from "@venext/shared-contracts";
import { useEffect, useState } from "react";

import { fetchDataIntelligenceBundleJson, fetchDataIntelligenceJson } from "./data-intelligence-api";
import { loadDataIntelligenceSequential } from "./data-intelligence-sequential-load";

export type DataIntelligenceBundle = {
  overview: unknown;
  ontology: unknown;
  correlations: unknown;
  anomalies: unknown;
  predictiveSignals: unknown;
  territoryIntelligence: unknown;
  graphIntelligence: unknown;
  decisionSimulation: unknown;
  economicScore: unknown;
  dataQuality: unknown;
  briefing: unknown;
  interventions: unknown;
};

export function useDataIntelligenceData(organizationId: string | null, enabled: boolean) {
  const [bundle, setBundle] = useState<Partial<DataIntelligenceBundle>>({});
  const [loading, setLoading] = useState(true);
  const [hydratedVia, setHydratedVia] = useState<"bundle" | "sequential" | null>(null);

  useEffect(() => {
    if (!enabled || !organizationId) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setHydratedVia(null);

    void (async () => {
      let packed = await fetchDataIntelligenceBundleJson<DataIntelligenceBundleResponse>(organizationId);
      if (!packed?.version) {
        packed = await fetchDataIntelligenceBundleJson<DataIntelligenceBundleResponse>(organizationId);
      }
      if (!cancelled && packed?.version === "1") {
        setBundle({
          overview: packed.overview,
          ontology: packed.ontology,
          correlations: packed.correlations,
          anomalies: packed.anomalies,
          predictiveSignals: packed.predictiveSignals,
          territoryIntelligence: packed.territoryIntelligence,
          graphIntelligence: packed.graphIntelligence,
          decisionSimulation: packed.decisionSimulation,
          economicScore: packed.economicScore,
          dataQuality: packed.dataQuality,
          briefing: packed.briefing,
          interventions: packed.interventions,
        });
        setHydratedVia("bundle");
        setLoading(false);
        return;
      }

      const fetchPanel = (suffix: string) => fetchDataIntelligenceJson(suffix, organizationId);
      const { partial } = await loadDataIntelligenceSequential(fetchPanel);
      if (cancelled) return;
      setBundle({
        overview: partial.overview,
        ontology: partial.ontology,
        correlations: partial.correlations,
        anomalies: partial.anomalies,
        predictiveSignals: partial.predictiveSignals,
        territoryIntelligence: partial.territoryIntelligence,
        graphIntelligence: partial.graphIntelligence,
        decisionSimulation: partial.decisionSimulation,
        economicScore: partial.economicScore,
        dataQuality: partial.dataQuality,
        briefing: partial.briefing,
        interventions: partial.interventions,
      });
      setHydratedVia("sequential");
      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [organizationId, enabled]);

  return { bundle, loading, hydratedVia };
}
