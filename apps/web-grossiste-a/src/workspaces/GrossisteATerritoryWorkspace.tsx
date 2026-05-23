import { memo, useMemo } from "react";

import { GrossisteAWorkspaceFrame } from "../components/GrossisteAWorkspaceFrame";
import { buildTerritorySignals } from "../grossiste-a-intelligence";
import { useGrossisteATerritoryData } from "../hooks/useGrossisteATerritoryData";
import { GrossisteAHintList } from "../widgets/GrossisteAHintList";

export const GrossisteATerritoryWorkspace = memo(function GrossisteATerritoryWorkspace({
  enabled,
}: {
  enabled: boolean;
  routingInput?: import("commercial-context-routing").CommercialContextRoutingInput;
}) {
  const { data, loading, dataSource, fallbackUsed, refresh } = useGrossisteATerritoryData(enabled);
  const hints = useMemo(() => buildTerritorySignals(data), [data]);

  return (
    <GrossisteAWorkspaceFrame
      title="Activité Territoire"
      subtitle="Le territoire vit"
      loading={loading}
      onRefresh={refresh}
      dataSource={dataSource}
      fallbackUsed={fallbackUsed}
      testId="ga-workspace-territory"
    >
      <GrossisteAHintList hints={hints} testId="ga-territory-hints" />
      <p className="ga-section-title">Activité par ville</p>
      {(data?.cityActivity ?? []).map((c) => (
        <article key={c.city} className="ga-card" data-testid={`ga-city-${c.city}`}>
          <strong>{c.city}</strong> — {c.level} ({c.growth})
        </article>
      ))}
      <p className="ga-section-title">Partenaires régionaux</p>
      {(data?.regionalPartners ?? []).map((p) => (
        <article key={p.id} className="ga-card">
          {p.name} · {p.city}
        </article>
      ))}
    </GrossisteAWorkspaceFrame>
  );
});
