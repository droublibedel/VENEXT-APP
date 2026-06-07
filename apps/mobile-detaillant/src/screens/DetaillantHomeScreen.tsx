import { memo, useMemo } from "react";

import { VenextTerrainKpiGrid } from "commerce-ux-harmony";
import "commerce-ux-harmony/terrain-kpi.css";

import { DetaillantScreenHeader } from "../components/DetaillantScreenHeader";
import { buildHomeSummary } from "../detaillant-intelligence";
import { useDetaillantHomeData } from "../hooks/useDetaillantHomeData";
import { DetaillantRelationalFeedBridge } from "../feed/DetaillantRelationalFeedBridge";
import { useDetaillantFeatureFlags } from "../hooks/useDetaillantFeatureFlags";
import { DetaillantMetricCard } from "../widgets/DetaillantMetricCard";

export const DetaillantHomeScreen = memo(function DetaillantHomeScreen({
  enabled,
}: {
  enabled: boolean;
  routingInput?: import("commercial-context-routing").CommercialContextRoutingInput;
}) {
  const { flags } = useDetaillantFeatureFlags();
  const { data, loading } = useDetaillantHomeData(enabled);
  const feedEnabled = flags.commercial_activity_feed_enabled !== false;
  const summary = useMemo(() => buildHomeSummary(data), [data]);

  return (
    <section data-testid="detaillant-screen-home">
      <DetaillantScreenHeader title="Accueil" subtitle="L'application m'aide à mieux vendre" />

      {summary ? (
        <p className="terrain-home-summary" data-testid="detaillant-home-summary">
          {summary}
        </p>
      ) : null}

      <VenextTerrainKpiGrid columns={3}>
        <DetaillantMetricCard label="Activité du jour" value={data?.activityToday ?? "—"} testId="detaillant-metric-activity" />
        <DetaillantMetricCard label="Ventes" value={data?.salesTodayLabel ?? "—"} testId="detaillant-metric-sales" />
        <DetaillantMetricCard label="Partenaires actifs" value={data?.activePartners ?? "—"} testId="detaillant-metric-partners" />
      </VenextTerrainKpiGrid>

      {feedEnabled ? (
        <>
          <h2 className="detaillant-section-title">Réseau commercial</h2>
          <DetaillantRelationalFeedBridge enabled={enabled && !loading} />
        </>
      ) : null}

      {data?.popularProducts?.length ? (
        <>
          <h2 className="detaillant-section-title">Catalogue récent</h2>
          {data.popularProducts.map((p) => (
            <article key={p.id} className="detaillant-card" data-testid={`detaillant-popular-${p.id}`}>
              <strong style={{ fontSize: 15 }}>{p.name}</strong>
              <span style={{ float: "right", fontSize: 12, color: "var(--venext-text-secondary)" }}>{p.category}</span>
            </article>
          ))}
        </>
      ) : null}

      {data?.recentOrders?.length ? (
        <>
          <h2 className="detaillant-section-title">Activité récente</h2>
          {data.recentOrders.map((o) => (
            <article key={o.id} className="detaillant-card" data-testid={`detaillant-recent-order-${o.id}`}>
              <p style={{ margin: 0, fontWeight: 600 }}>{o.partner}</p>
              <p style={{ margin: "8px 0 0", fontSize: 14, color: "var(--venext-text-secondary)" }}>
                {o.amountLabel} · {o.status}
              </p>
            </article>
          ))}
        </>
      ) : null}
    </section>
  );
});
