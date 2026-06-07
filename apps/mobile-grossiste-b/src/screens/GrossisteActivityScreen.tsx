import { memo, useMemo } from "react";

import type { CommercialContextRoutingInput } from "commercial-context-routing";
import { VenextTerrainKpiGrid } from "commerce-ux-harmony";
import "commerce-ux-harmony/terrain-kpi.css";

import { GrossisteBCommercialDelivery } from "../delivery/GrossisteBCommercialDelivery";
import { GrossisteScreenHeader } from "../components/GrossisteScreenHeader";
import { useGrossisteActivityData } from "../hooks/useGrossisteActivityData";
import { buildActivitySummary } from "../mocks/grossiste-b-intelligence";
import { GrossisteBRelationalFeedBridge } from "../feed/GrossisteBRelationalFeedBridge";
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
  const { data, loading } = useGrossisteActivityData(enabled);
  const feedEnabled = flags.commercial_activity_feed_enabled !== false;
  const summary = useMemo(() => buildActivitySummary(data), [data]);

  return (
    <section data-testid="grossiste-screen-activity">
      <GrossisteScreenHeader title="Activité" subtitle="Mon activité bouge aujourd'hui" />

      {summary ? (
        <p className="terrain-home-summary" data-testid="grossiste-activity-summary">
          {summary}
        </p>
      ) : null}

      <VenextTerrainKpiGrid columns={2}>
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
      </VenextTerrainKpiGrid>

      {feedEnabled ? (
        <>
          <h2 className="grossiste-b-section-title">Réseau commercial</h2>
          <GrossisteBRelationalFeedBridge enabled={enabled && !loading} />
        </>
      ) : null}

      {data?.movingProducts?.length ? (
        <>
          <h2 className="grossiste-b-section-title">Catalogue récent</h2>
          {data.movingProducts.map((p) => (
            <article key={p.id} className="grossiste-b-card" data-testid={`grossiste-moving-${p.id}`}>
              <strong>{p.name}</strong>
              <span style={{ float: "right", fontSize: 12, color: "var(--venext-text-secondary)" }}>
                {p.momentum === "up" ? "↑" : "→"}
              </span>
            </article>
          ))}
        </>
      ) : null}

      {data?.simpleAlerts?.length ? (
        <>
          <h2 className="grossiste-b-section-title">Activité récente</h2>
          {data.simpleAlerts.map((a) => (
            <article key={a.id} className="grossiste-b-card">
              <p style={{ margin: 0, fontSize: 13 }}>{a.text}</p>
            </article>
          ))}
        </>
      ) : null}

      <GrossisteBCommercialDelivery enabled={enabled} contextRouting={routingInput} />
    </section>
  );
});
