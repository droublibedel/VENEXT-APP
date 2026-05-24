import { lazy, memo, Suspense, useMemo } from "react";

import { DetaillantDataSourceBadge } from "../components/DetaillantDataSourceBadge";
import { DetaillantScreenHeader } from "../components/DetaillantScreenHeader";
import { buildPartnerHints } from "../detaillant-intelligence";
import { useDetaillantFeatureFlags } from "../hooks/useDetaillantFeatureFlags";
import { useDetaillantNetworkData } from "../hooks/useDetaillantNetworkData";
import { DetaillantHintStrip } from "../widgets/DetaillantHintStrip";
import { VenextScreenLoader } from "../ux/VenextScreenLoader";

const DetaillantNetworkDiscovery = lazy(() =>
  import("../network/DetaillantNetworkDiscovery").then((m) => ({
    default: m.DetaillantNetworkDiscovery,
  })),
);

export const DetaillantNetworkScreen = memo(function DetaillantNetworkScreen({
  enabled,
}: {
  enabled: boolean;
}) {
  const { flags, hydrated } = useDetaillantFeatureFlags();
  const discoveryEnabled =
    hydrated && flags.commercial_network_discovery_enabled !== false;

  const { data, loading, dataSource, fallbackUsed, refresh } = useDetaillantNetworkData(
    enabled && !discoveryEnabled,
  );
  const hints = useMemo(() => buildPartnerHints(data), [data]);

  return (
    <section data-testid="detaillant-screen-network">
      <DetaillantScreenHeader
        title="Réseau"
        subtitle={discoveryEnabled ? "Vos fournisseurs, naturellement" : "Le commerce bouge autour de moi"}
        onRefresh={discoveryEnabled ? undefined : refresh}
        refreshing={discoveryEnabled ? false : loading}
      />

      {discoveryEnabled ? (
        <Suspense fallback={<VenextScreenLoader variant="dashboard" />}>
          <DetaillantNetworkDiscovery
            enabled={enabled}
            onQuickOrder={() => {
              /* commande rapide — fondation */
            }}
            onMessage={() => {
              /* messagerie — fondation */
            }}
          />
        </Suspense>
      ) : (
        <>
          <DetaillantDataSourceBadge dataSource={dataSource} fallbackUsed={fallbackUsed} loading={loading} />
          <DetaillantHintStrip hints={hints} testId="detaillant-network-hints" />

          <h2 style={{ fontSize: 15, margin: "0 0 10px", color: "var(--venext-text-muted)", fontWeight: 600 }}>Fournisseurs actifs</h2>
          {data?.activeSuppliers.map((s) => (
            <article key={s.id} className="detaillant-card" data-testid={`detaillant-supplier-${s.id}`}>
              <p style={{ margin: 0, fontWeight: 700 }}>{s.name}</p>
              <p style={{ margin: "6px 0 0", fontSize: 13, color: "var(--venext-text-muted)" }}>
                {s.type} · {s.city}
              </p>
            </article>
          ))}

          <h2 style={{ fontSize: 15, margin: "16px 0 10px", color: "var(--venext-text-muted)", fontWeight: 600 }}>Nouveaux partenaires</h2>
          {data?.newPartners.map((p) => (
            <article key={p.id} className="detaillant-card">
              <p style={{ margin: 0, fontWeight: 600 }}>{p.name}</p>
              <p style={{ margin: "6px 0 0", fontSize: 13, color: "var(--venext-text-muted)" }}>
                {p.city} · {p.since}
              </p>
            </article>
          ))}

          <h2 style={{ fontSize: 15, margin: "16px 0 10px", color: "var(--venext-text-muted)", fontWeight: 600 }}>Activité ville</h2>
          <p data-testid="detaillant-city-activity" style={{ fontSize: 14 }}>
            {(data?.cityActivity ?? [])
              .map((c) => `${c.city} (${c.level === "active" ? "actif" : c.level === "moderate" ? "modéré" : "calme"})`)
              .join(" · ")}
          </p>

          <h2 style={{ fontSize: 15, margin: "16px 0 10px", color: "var(--venext-text-muted)", fontWeight: 600 }}>Produits tendance</h2>
          {data?.trendingProducts.map((p) => (
            <article key={p.id} className="detaillant-card" data-testid={`detaillant-trend-${p.id}`}>
              <p style={{ margin: 0, fontWeight: 600 }}>{p.name}</p>
              <p style={{ margin: "6px 0 0", fontSize: 13, color: "var(--venext-accent)" }}>{p.note}</p>
            </article>
          ))}
        </>
      )}
    </section>
  );
});
