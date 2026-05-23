import { memo, useMemo } from "react";

import { GrossisteAWorkspaceFrame } from "../components/GrossisteAWorkspaceFrame";
import { buildIntelligenceView } from "../grossiste-a-intelligence";
import { useGrossisteAIntelligenceData } from "../hooks/useGrossisteAIntelligenceData";
import { GrossisteAHintList } from "../widgets/GrossisteAHintList";

export const GrossisteAIntelligenceWorkspace = memo(function GrossisteAIntelligenceWorkspace({
  enabled,
}: {
  enabled: boolean;
}) {
  const { data, loading, dataSource, fallbackUsed, refresh } = useGrossisteAIntelligenceData(enabled);
  const { hints, suggestions } = useMemo(() => buildIntelligenceView(data), [data]);

  return (
    <GrossisteAWorkspaceFrame
      title="Activité réseau"
      subtitle="Couverture commerciale et zones à suivre — pas de pilotage industriel"
      loading={loading}
      onRefresh={refresh}
      dataSource={dataSource}
      fallbackUsed={fallbackUsed}
      testId="ga-workspace-intelligence"
    >
      <GrossisteAHintList hints={hints} testId="ga-intelligence-hints" />
      <p className="ga-section-title">Zones à surveiller</p>
      <p data-testid="ga-watch-zones">{(data?.watchZones ?? []).join(" · ")}</p>
      <p className="ga-section-title">Produits dynamiques</p>
      <p>{(data?.dynamicProducts ?? []).join(" · ")}</p>
      <p className="ga-section-title">Suggestions</p>
      {suggestions.map((s, i) => (
        <article key={i} className="ga-card" data-testid={`ga-suggestion-${i}`}>
          {s}
        </article>
      ))}
    </GrossisteAWorkspaceFrame>
  );
});
