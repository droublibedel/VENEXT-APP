"use client";

import { memo, useMemo, useState } from "react";

import { CommercialCatalogPreview } from "./CommercialCatalogPreview";
import { CommercialContactSuggestions } from "./CommercialContactSuggestions";
import { CommercialContactSyncPanel } from "./CommercialContactSyncPanel";
import { CommercialDiscoveryInsights } from "./CommercialDiscoveryInsights";
import { CommercialInstantConnection } from "./CommercialInstantConnection";
import { CommercialPartnerPreview } from "./CommercialPartnerPreview";
import { resolveCommercialDiscoveryGovernance } from "./commercial-network-discovery-governance";
import type { CommercialDiscoveryShellProps } from "./commercial-network-discovery.types";
import { useCommercialContactDiscovery } from "./useCommercialContactDiscovery";

function DiscoveryShellInner({
  actorRole,
  enabled = true,
  injected,
  flags = {},
}: CommercialDiscoveryShellProps) {
  const governance = useMemo(
    () => resolveCommercialDiscoveryGovernance(actorRole, flags),
    [actorRole, flags],
  );

  const discovery = useCommercialContactDiscovery({
    actorRole: actorRole === "detaillant" ? "detaillant" : "grossiste_b",
    injected,
    enabled,
    flags,
  });

  const grantSync = discovery.grantContactSync ?? (() => {});

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const view = discovery.view;
  const syncGranted = view?.contactSyncGranted ?? false;

  const selected = useMemo(() => {
    if (!selectedId || !view) return null;
    return view.suggestions.find((s) => s.id === selectedId) ?? null;
  }, [selectedId, view]);

  const catalog = selectedId ? discovery.catalogByPartnerId?.[selectedId] ?? null : null;
  const showCatalog =
    governance.catalogVisibleAfterConnection &&
    Boolean(selected && (selected.partnerStatus === "connected" || syncGranted));

  if (!enabled || flags.commercial_network_discovery_enabled === false) {
    return (
      <section className="cnd-shell" data-testid="cnd-discovery-disabled">
        <p className="cnd-hint">{governance.notice ?? "Découverte réseau non activée."}</p>
      </section>
    );
  }

  if (!governance.terrainMode) {
    return (
      <section className="cnd-shell" data-testid="cnd-discovery-formal-only">
        <p className="cnd-hint">
          Mode formel — les relations terrain (auto-accept) ne s&apos;appliquent pas à ce profil.
        </p>
      </section>
    );
  }

  const handleConnect = (id: string) => {
    if (governance.autoAcceptCommercialConnections) {
      discovery.onConnect?.(id);
      setSelectedId(id);
    } else {
      discovery.onConnect?.(id);
    }
  };

  return (
    <section className="cnd-shell" data-testid="commercial-network-discovery-shell">
      <header className="cnd-header">
        <h2 className="cnd-title">Retrouver mon réseau</h2>
        <p className="cnd-subtitle">
          Basé sur vos contacts téléphone — VENEXT révèle un réseau commercial déjà existant.
        </p>
        {discovery.onRefresh ? (
          <button
            type="button"
            className="cnd-btn"
            style={{ marginTop: 8 }}
            onClick={discovery.onRefresh}
            data-testid="cnd-refresh"
          >
            Actualiser
          </button>
        ) : null}
      </header>

      <CommercialDiscoveryInsights view={view} />

      {governance.contactSyncEnabled ? (
        <CommercialContactSyncPanel
          granted={syncGranted}
          localContactsCount={view?.localContactsCount ?? 0}
          onGrant={grantSync}
        />
      ) : null}

      {governance.autoAcceptCommercialConnections ? (
        <CommercialInstantConnection
          autoAccept
          disabled={!syncGranted}
          onInstantConnect={() => {
            const first = view?.suggestions.find((s) => s.partnerStatus !== "connected");
            if (first) handleConnect(first.id);
          }}
        />
      ) : null}

      {governance.autoPartnerSuggestions && view ? (
        <CommercialContactSuggestions
          suggestions={view.suggestions}
          syncGranted={syncGranted}
          autoAccept={governance.autoAcceptCommercialConnections}
          onConnect={(id) => {
            handleConnect(id);
            setSelectedId(id);
          }}
        />
      ) : null}

      <CommercialPartnerPreview
        partner={selected}
        catalog={catalog}
        onMessage={selected ? () => discovery.onMessage?.(selected.id) : undefined}
        onQuickOrder={selected ? () => discovery.onQuickOrder?.(selected.id) : undefined}
      />

      <CommercialCatalogPreview catalog={catalog} visible={showCatalog} />

      {discovery.loading ? (
        <p className="cnd-hint" data-testid="cnd-loading">
          Chargement du réseau…
        </p>
      ) : null}

      <span
        className="venext-sr-only"
        data-testid="cnd-data-source"
        data-source={discovery.dataSource}
        data-fallback={discovery.fallbackUsed ? "true" : "false"}
        aria-hidden
      />
    </section>
  );
}

export const CommercialNetworkDiscoveryShell = memo(function CommercialNetworkDiscoveryShell(
  props: CommercialDiscoveryShellProps,
) {
  return <DiscoveryShellInner {...props} />;
});
