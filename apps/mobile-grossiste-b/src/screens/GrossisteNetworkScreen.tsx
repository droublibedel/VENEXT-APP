import { lazy, memo, Suspense, useMemo } from "react";

import { GrossisteDataSourceBadge } from "../components/GrossisteDataSourceBadge";
import { GrossisteScreenHeader } from "../components/GrossisteScreenHeader";
import { useGrossisteFeatureFlags } from "../hooks/useGrossisteFeatureFlags";
import { useGrossisteNetworkData } from "../hooks/useGrossisteNetworkData";
import { buildPartnerSuggestions } from "../mocks/grossiste-b-intelligence";
import { GrossisteHintStrip } from "../widgets/GrossisteHintStrip";
import { VenextScreenLoader } from "../ux/VenextScreenLoader";

const GrossisteBNetworkDiscovery = lazy(() =>
  import("../network/GrossisteBNetworkDiscovery").then((m) => ({
    default: m.GrossisteBNetworkDiscovery,
  })),
);

export const GrossisteNetworkScreen = memo(function GrossisteNetworkScreen({
  enabled,
}: {
  enabled: boolean;
}) {
  const { flags, hydrated } = useGrossisteFeatureFlags();
  const discoveryEnabled =
    hydrated && flags.commercial_network_discovery_enabled !== false;

  const { data, loading, dataSource, fallbackUsed, refresh } = useGrossisteNetworkData(
    enabled && !discoveryEnabled,
  );
  const hints = useMemo(() => buildPartnerSuggestions(data), [data]);

  return (
    <section data-testid="grossiste-screen-network">
      <GrossisteScreenHeader
        title="Réseau"
        subtitle={discoveryEnabled ? "Retrouvez vos contacts commerciaux" : "Le réseau vit autour de vous"}
        onRefresh={discoveryEnabled ? undefined : refresh}
        refreshing={discoveryEnabled ? false : loading}
      />

      {discoveryEnabled ? (
        <Suspense fallback={<VenextScreenLoader variant="dashboard" />}>
          <GrossisteBNetworkDiscovery
            enabled={enabled}
            onQuickOrder={() => {
              /* navigation commande rapide — fondation */
            }}
            onMessage={() => {
              /* ouverture messagerie — fondation */
            }}
          />
        </Suspense>
      ) : (
        <>
          <GrossisteDataSourceBadge dataSource={dataSource} fallbackUsed={fallbackUsed} loading={loading} />
          <GrossisteHintStrip hints={hints} testId="grossiste-network-hints" />

          <h2 style={{ fontSize: 14, margin: "0 0 8px", color: "var(--venext-text-muted)" }}>Partenaires récents</h2>
          {data?.recentPartners.map((p) => (
            <article key={p.id} className="grossiste-b-card" data-testid={`grossiste-partner-${p.id}`}>
              <p style={{ margin: 0, fontWeight: 600 }}>{p.name}</p>
              <p style={{ margin: "4px 0 0", fontSize: 12, color: "var(--venext-text-muted)" }}>
                {p.type} · {p.city} · {p.lastActive}
              </p>
            </article>
          ))}

          <h2 style={{ fontSize: 14, margin: "16px 0 8px", color: "var(--venext-text-muted)" }}>Partenaires actifs</h2>
          {data?.activePartners.map((p) => (
            <article key={p.id} className="grossiste-b-card">
              <p style={{ margin: 0, fontWeight: 600 }}>{p.name}</p>
              <p style={{ margin: "4px 0 0", fontSize: 12, color: "var(--venext-accent)" }}>
                {p.city} — {p.orders7d} commandes / 7j
              </p>
            </article>
          ))}

          <h2 style={{ fontSize: 14, margin: "16px 0 8px", color: "var(--venext-text-muted)" }}>Villes actives</h2>
          <p style={{ fontSize: 13, color: "var(--venext-text)" }} data-testid="grossiste-active-cities">
            {(data?.activeCities ?? []).join(" · ")}
          </p>

          <h2 style={{ fontSize: 14, margin: "16px 0 8px", color: "var(--venext-text-muted)" }}>Corridors</h2>
          {data?.corridorActivity.map((c) => (
            <article key={c.id} className="grossiste-b-card" data-testid={`grossiste-corridor-${c.id}`}>
              <p style={{ margin: 0, fontSize: 13 }}>{c.label}</p>
              <p style={{ margin: "4px 0 0", fontSize: 12, color: "var(--venext-accent)" }}>
                {c.level === "active" ? "Actif" : c.level === "moderate" ? "Modéré" : "Calme"}
              </p>
            </article>
          ))}
        </>
      )}
    </section>
  );
});
