import { memo } from "react";

import { GrossisteAWorkspaceFrame } from "../components/GrossisteAWorkspaceFrame";
import { useGrossisteAFinanceData } from "../hooks/useGrossisteAFinanceData";

export const GrossisteAFinanceWorkspace = memo(function GrossisteAFinanceWorkspace({
  enabled,
}: {
  enabled: boolean;
}) {
  const { data, loading, dataSource, fallbackUsed, refresh } = useGrossisteAFinanceData(enabled);

  return (
    <GrossisteAWorkspaceFrame
      title="Finance"
      subtitle="Encaissements et couverture — pas de wallet"
      loading={loading}
      onRefresh={refresh}
      dataSource={dataSource}
      fallbackUsed={fallbackUsed}
      testId="ga-workspace-finance"
    >
      <div className="ga-metrics">
        <article className="ga-card" data-testid="ga-finance-stability">
          <p className="ga-metric-label">Stabilité encaissements</p>
          <p className="ga-metric-value" style={{ fontSize: 18 }}>
            {data?.collectionStability ?? "—"}
          </p>
        </article>
        <article className="ga-card">
          <p className="ga-metric-label">Couverture revenus</p>
          <p className="ga-metric-value" style={{ fontSize: 16 }}>
            {data?.revenueCoverage ?? "—"}
          </p>
        </article>
      </div>
      <p style={{ margin: "12px 0", fontSize: 14 }}>{data?.financialActivity}</p>
      <p className="ga-section-title">Partenaires fiables</p>
      {(data?.reliablePartners ?? []).map((p) => (
        <article key={p.id} className="ga-card">
          {p.name}
        </article>
      ))}
      <p className="ga-section-title">Zones sous tension</p>
      <p data-testid="ga-tension-zones">{(data?.tensionZones ?? []).join(" · ") || "Aucune"}</p>
    </GrossisteAWorkspaceFrame>
  );
});
