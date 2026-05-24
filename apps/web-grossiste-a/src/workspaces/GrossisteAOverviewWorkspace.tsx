import { memo } from "react";

import { GrossisteAActivityFeedBridge } from "../activity/GrossisteAActivityFeedBridge";
import { GrossisteAWorkspaceFrame } from "../components/GrossisteAWorkspaceFrame";
import { GrossisteAPoleBusinessBridge } from "../governance/GrossisteAPoleBusinessBridge";
import { useGrossisteAFeatureFlags } from "../hooks/useGrossisteAFeatureFlags";
import { useGrossisteAOverviewData } from "../hooks/useGrossisteAOverviewData";

export const GrossisteAOverviewWorkspace = memo(function GrossisteAOverviewWorkspace({
  enabled,
}: {
  enabled: boolean;
}) {
  const { flags } = useGrossisteAFeatureFlags();
  const { data, loading, dataSource, fallbackUsed, refresh } = useGrossisteAOverviewData(enabled);
  const feedEnabled = flags.commercial_activity_feed_enabled !== false;

  return (
    <GrossisteAWorkspaceFrame
      title="Vue d'ensemble"
      subtitle="Supervision distribution — réseau, commandes et territoire"
      loading={loading}
      onRefresh={refresh}
      dataSource={dataSource}
      fallbackUsed={fallbackUsed}
      testId="ga-workspace-overview"
    >
      <GrossisteAPoleBusinessBridge
        workspaceId="overview"
        signalValues={{
          "pc-pending-orders": String(data?.activeOrders ?? "—"),
          "pc-partners": String(data?.activePartners ?? "—"),
          "pc-network": data?.networkStability ?? "—",
        }}
      />
      <div className="ga-metrics">
        <article className="ga-card" data-testid="ga-metric-activity">
          <p className="ga-metric-label">Activité du jour</p>
          <p className="ga-metric-value">{data?.activityToday ?? "—"}</p>
        </article>
        <article className="ga-card">
          <p className="ga-metric-label">Commandes actives</p>
          <p className="ga-metric-value">{data?.activeOrders ?? "—"}</p>
        </article>
        <article className="ga-card">
          <p className="ga-metric-label">Partenaires actifs</p>
          <p className="ga-metric-value">{data?.activePartners ?? "—"}</p>
        </article>
        <article className="ga-card">
          <p className="ga-metric-label">Stabilité réseau</p>
          <p className="ga-metric-value" style={{ fontSize: 16 }}>
            {data?.networkStability ?? "—"}
          </p>
        </article>
      </div>
      {feedEnabled ? (
        <>
          <p className="ga-section-title">Fil commercial relationnel</p>
          <GrossisteAActivityFeedBridge />
        </>
      ) : null}
      <p className="ga-section-title">Villes dynamiques</p>
      <p data-testid="ga-dynamic-cities">{(data?.dynamicCities ?? []).join(" · ") || "—"}</p>
      <p className="ga-section-title">Produits en mouvement</p>
      {(data?.movingProducts ?? []).map((p) => (
        <article key={p.id} className="ga-card">
          <strong>{p.name}</strong> <span style={{ color: "#526059" }}>{p.category}</span>
        </article>
      ))}
      <p className="ga-section-title">Alertes</p>
      {(data?.simpleAlerts ?? []).map((a) => (
        <article key={a.id} className="ga-card">
          {a.text}
        </article>
      ))}
      <p className="ga-section-title">Tendances</p>
      {(data?.visibleTrends ?? []).map((t) => (
        <article key={t.id} className="ga-card">
          {t.label} ({t.direction})
        </article>
      ))}
    </GrossisteAWorkspaceFrame>
  );
});
