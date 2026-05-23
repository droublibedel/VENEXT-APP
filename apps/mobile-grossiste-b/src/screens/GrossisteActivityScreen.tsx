import { memo, useMemo } from "react";
import type { CommercialContextRoutingInput } from "commercial-context-routing";

import { GrossisteBCommercialDelivery } from "../delivery/GrossisteBCommercialDelivery";
import { GrossisteDataSourceBadge } from "../components/GrossisteDataSourceBadge";
import { GrossisteScreenHeader } from "../components/GrossisteScreenHeader";
import { useGrossisteActivityData } from "../hooks/useGrossisteActivityData";
import { buildActivityHints } from "../mocks/grossiste-b-intelligence";
import { GrossisteBRelationalFeedBridge } from "../feed/GrossisteBRelationalFeedBridge";
import { GrossisteHintStrip } from "../widgets/GrossisteHintStrip";
import { useGrossisteFeatureFlags } from "../hooks/useGrossisteFeatureFlags";
import { GrossisteMetricCard } from "../widgets/GrossisteMetricCard";

export const GrossisteActivityScreen = memo(function GrossisteActivityScreen({
  enabled,
  routingInput,
}: {
  enabled: boolean;
  routingInput?: CommercialContextRoutingInput;
}) {
  const { flags } = useGrossisteFeatureFlags();
  const { data, loading, dataSource, fallbackUsed, refresh } = useGrossisteActivityData(enabled);
  const hints = useMemo(() => buildActivityHints(data), [data]);
  const feedEnabled = flags.commercial_activity_feed_enabled !== false;

  return (
    <section data-testid="grossiste-screen-activity">
      <GrossisteScreenHeader
        title="Activité"
        subtitle="Mon activité bouge aujourd'hui"
        onRefresh={refresh}
        refreshing={loading}
      />
      <GrossisteDataSourceBadge dataSource={dataSource} fallbackUsed={fallbackUsed} loading={loading} />
      <GrossisteBCommercialDelivery enabled={enabled} contextRouting={routingInput} />
      <GrossisteHintStrip hints={hints} testId="grossiste-activity-hints" />

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 10,
          marginBottom: 14,
        }}
      >
        <GrossisteMetricCard
          label="Réseau aujourd'hui"
          value={data?.networkActivityToday ?? "—"}
          testId="grossiste-metric-network"
        />
        <GrossisteMetricCard
          label="Nouvelles commandes"
          value={data?.newOrdersCount ?? "—"}
          testId="grossiste-metric-orders"
        />
        <GrossisteMetricCard
          label="Partenaires actifs"
          value={data?.activePartners ?? "—"}
          testId="grossiste-metric-partners"
        />
        <GrossisteMetricCard
          label="Villes actives"
          value={data?.activeCities.length ?? "—"}
          testId="grossiste-metric-cities"
        />
      </div>

      {data?.movingProducts?.length ? (
        <>
          <h2 style={{ fontSize: 14, margin: "16px 0 8px", color: "#8fa39a" }}>Produits qui bougent</h2>
          {data.movingProducts.map((p) => (
            <article key={p.id} className="grossiste-b-card" data-testid={`grossiste-moving-${p.id}`}>
              <strong>{p.name}</strong>
              <span style={{ float: "right", fontSize: 12, color: "#00a884" }}>
                {p.momentum === "up" ? "↑" : "→"}
              </span>
            </article>
          ))}
        </>
      ) : null}

      {data?.simpleAlerts?.length ? (
        <>
          <h2 style={{ fontSize: 14, margin: "16px 0 8px", color: "#8fa39a" }}>À noter</h2>
          {data.simpleAlerts.map((a) => (
            <article key={a.id} className="grossiste-b-card">
              <p style={{ margin: 0, fontSize: 13 }}>{a.text}</p>
            </article>
          ))}
        </>
      ) : null}

      {feedEnabled ? (
        <>
          <h2 style={{ fontSize: 14, margin: "16px 0 8px", color: "#8fa39a" }}>Fil relationnel</h2>
          <GrossisteBRelationalFeedBridge />
        </>
      ) : null}

      {data?.discreetTrends?.length ? (
        <>
          <h2 style={{ fontSize: 14, margin: "16px 0 8px", color: "#8fa39a" }}>Tendances discrètes</h2>
          {data.discreetTrends.map((t) => (
            <article key={t.id} className="grossiste-b-card">
              <p style={{ margin: 0, fontSize: 13 }}>{t.label}</p>
            </article>
          ))}
        </>
      ) : null}
    </section>
  );
});
