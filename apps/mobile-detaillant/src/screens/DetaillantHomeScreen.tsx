import { memo, useMemo } from "react";

import { DetaillantDataSourceBadge } from "../components/DetaillantDataSourceBadge";
import { DetaillantScreenHeader } from "../components/DetaillantScreenHeader";
import {
  buildActivityHints,
  buildSalesSignals,
} from "../detaillant-intelligence";
import { useDetaillantHomeData } from "../hooks/useDetaillantHomeData";
import { DetaillantRelationalFeedBridge } from "../feed/DetaillantRelationalFeedBridge";
import { useDetaillantFeatureFlags } from "../hooks/useDetaillantFeatureFlags";
import { DetaillantHintStrip } from "../widgets/DetaillantHintStrip";
import { DetaillantMetricCard } from "../widgets/DetaillantMetricCard";

export const DetaillantHomeScreen = memo(function DetaillantHomeScreen({
  enabled,
}: {
  enabled: boolean;
  routingInput?: import("commercial-context-routing").CommercialContextRoutingInput;
}) {
  const { flags } = useDetaillantFeatureFlags();
  const { data, loading, dataSource, fallbackUsed, refresh } = useDetaillantHomeData(enabled);
  const feedEnabled = flags.commercial_activity_feed_enabled !== false;
  const salesHints = useMemo(() => buildSalesSignals(data), [data]);
  const activityHints = useMemo(() => buildActivityHints(data), [data]);
  const hints = useMemo(() => [...salesHints, ...activityHints].slice(0, 4), [salesHints, activityHints]);

  return (
    <section data-testid="detaillant-screen-home">
      <DetaillantScreenHeader
        title="Accueil"
        subtitle="L'application m'aide à mieux vendre"
        onRefresh={refresh}
        refreshing={loading}
      />
      <DetaillantDataSourceBadge dataSource={dataSource} fallbackUsed={fallbackUsed} loading={loading} />
      <DetaillantHintStrip hints={hints} testId="detaillant-home-hints" />

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
        <DetaillantMetricCard label="Activité du jour" value={data?.activityToday ?? "—"} testId="detaillant-metric-activity" />
        <DetaillantMetricCard label="Ventes" value={data?.salesTodayLabel ?? "—"} testId="detaillant-metric-sales" />
        <DetaillantMetricCard label="Partenaires actifs" value={data?.activePartners ?? "—"} testId="detaillant-metric-partners" />
      </div>

      {feedEnabled ? (
        <>
          <h2 style={{ fontSize: 15, margin: "16px 0 10px", color: "#8fa39a", fontWeight: 600 }}>Réseau commercial</h2>
          <DetaillantRelationalFeedBridge />
        </>
      ) : null}

      {data?.popularProducts?.length ? (
        <>
          <h2 style={{ fontSize: 15, margin: "0 0 10px", color: "#8fa39a", fontWeight: 600 }}>Produits populaires</h2>
          {data.popularProducts.map((p) => (
            <article key={p.id} className="detaillant-card" data-testid={`detaillant-popular-${p.id}`}>
              <strong style={{ fontSize: 15 }}>{p.name}</strong>
              <span style={{ float: "right", fontSize: 12, color: "#00a884" }}>{p.category}</span>
            </article>
          ))}
        </>
      ) : null}

      {data?.recentOrders?.length ? (
        <>
          <h2 style={{ fontSize: 15, margin: "16px 0 10px", color: "#8fa39a", fontWeight: 600 }}>Commandes récentes</h2>
          {data.recentOrders.map((o) => (
            <article key={o.id} className="detaillant-card" data-testid={`detaillant-recent-order-${o.id}`}>
              <p style={{ margin: 0, fontWeight: 600 }}>{o.partner}</p>
              <p style={{ margin: "6px 0 0", fontSize: 14, color: "#00a884" }}>
                {o.amountLabel} · {o.status}
              </p>
            </article>
          ))}
        </>
      ) : null}

      {data?.simpleAlerts?.length ? (
        <>
          <h2 style={{ fontSize: 15, margin: "16px 0 10px", color: "#8fa39a", fontWeight: 600 }}>À noter</h2>
          {data.simpleAlerts.map((a) => (
            <article key={a.id} className="detaillant-card">
              <p style={{ margin: 0, fontSize: 14 }}>{a.text}</p>
            </article>
          ))}
        </>
      ) : null}
    </section>
  );
});
