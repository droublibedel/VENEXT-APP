import { memo, useMemo } from "react";
import type { CommercialContextRoutingInput } from "commercial-context-routing";

import { GrossisteACommercialDelivery } from "../delivery/GrossisteACommercialDelivery";
import { GrossisteAWorkspaceFrame } from "../components/GrossisteAWorkspaceFrame";
import { buildDistributionHints } from "../grossiste-a-intelligence";
import { useGrossisteADistributionData } from "../hooks/useGrossisteADistributionData";
import { IndustrialMapControlSystem } from "../maps/IndustrialMapControlSystem";
import { GrossisteAHintList } from "../widgets/GrossisteAHintList";

export const GrossisteADistributionWorkspace = memo(function GrossisteADistributionWorkspace({
  enabled,
  routingInput,
}: {
  enabled: boolean;
  routingInput?: CommercialContextRoutingInput;
}) {
  const { data, loading, dataSource, fallbackUsed, refresh } = useGrossisteADistributionData(enabled);
  const hints = useMemo(() => buildDistributionHints(data), [data]);

  return (
    <GrossisteAWorkspaceFrame
      title="Distribution"
      subtitle="Corridors et flux"
      loading={loading}
      onRefresh={refresh}
      dataSource={dataSource}
      fallbackUsed={fallbackUsed}
      testId="ga-workspace-distribution"
    >
      <GrossisteACommercialDelivery enabled={enabled} contextRouting={routingInput} />
      <GrossisteAHintList hints={hints} />
      <IndustrialMapControlSystem
        layer="grossisteDistribution"
        data={data?.map}
        dataSource={dataSource}
        testId="ga-distribution-map"
      />
      <div style={{ marginTop: 16 }}>
        <IndustrialMapControlSystem layer="corridorPressure" compact data={data?.map} testId="ga-map-pressure" />
      </div>
      <p className="ga-section-title">Corridors actifs</p>
      {(data?.activeCorridors ?? []).map((c) => (
        <article key={c.id} className="ga-card" data-testid={`ga-corridor-${c.id}`}>
          {c.label} — {c.level}
        </article>
      ))}
      <p className="ga-section-title">Hubs dynamiques</p>
      <p data-testid="ga-hubs">{(data?.dynamicHubs ?? []).join(" · ")}</p>
    </GrossisteAWorkspaceFrame>
  );
});
