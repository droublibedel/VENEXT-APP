"use client";

import { memo, useMemo } from "react";

import { bindCatalogContextRouting } from "./commercial-context-bridge";
import { isRelationalCatalogEnabled } from "./relational-commerce-catalog-governance";
import type { RelationalCatalogShellProps } from "./relational-commerce-catalog.types";
import { RelationalCatalogDiscovery } from "./RelationalCatalogDiscovery";
import { RelationalCatalogEmptyState } from "./RelationalCatalogEmptyState";
import { RelationalCommercialContext } from "./RelationalCommercialContext";
import { RelationalOrderComposer } from "./RelationalOrderComposer";
import { RelationalOrderSummary } from "./RelationalOrderSummary";
import { RelationalSupplierCatalog } from "./RelationalSupplierCatalog";
import { useRelationalCommerceCatalog } from "./useRelationalCommerceCatalog";

function PartnerList({
  partners,
  activeId,
  onSelect,
}: {
  partners: { id: string; displayName: string }[];
  activeId: string | null;
  onSelect: (id: string) => void;
}) {
  return (
    <nav className="rcc-partner-nav" data-testid="rcc-partner-nav">
      {partners.map((p) => (
        <button
          key={p.id}
          type="button"
          className={`rcc-partner-btn${activeId === p.id ? " rcc-partner-btn--active" : ""}`}
          data-testid={`rcc-partner-${p.id}`}
          onClick={() => onSelect(p.id)}
        >
          {p.displayName}
        </button>
      ))}
    </nav>
  );
}

function RelationalCommerceCatalogShellInner({
  actorRole,
  enabled = true,
  flags = {},
  injected,
  onQuickOrder,
  onDiscuss,
  onMail,
  contextRouting,
}: RelationalCatalogShellProps) {
  const catalogCallbacks = useMemo(
    () => bindCatalogContextRouting({ onQuickOrder, onDiscuss, onMail }, contextRouting),
    [contextRouting, onQuickOrder, onDiscuss, onMail],
  );

  const catalog = useRelationalCommerceCatalog({
    actorRole,
    injected,
    enabled,
    flags,
  });

  const discoveries = useMemo(() => {
    if (flags.sponsored_catalog_discovery_enabled === false) {
      return catalog.view?.discoveries.filter((d) => !d.sponsored) ?? [];
    }
    return catalog.view?.discoveries ?? [];
  }, [catalog.view?.discoveries, flags.sponsored_catalog_discovery_enabled]);

  if (!enabled || !isRelationalCatalogEnabled(flags)) {
    return (
      <section data-testid="rcc-catalog-disabled" className="rcc-shell">
        <p className="rcc-hint">Catalogue relationnel — non activé pour cet environnement.</p>
      </section>
    );
  }

  if (catalog.loading) {
    return (
      <section data-testid="rcc-catalog-loading" className="rcc-shell">
        <p className="rcc-hint">Chargement des catalogues partenaires…</p>
      </section>
    );
  }

  if (!catalog.view || catalog.view.catalogs.length === 0) {
    return (
      <section data-testid="relational-commerce-catalog-shell" className="rcc-shell">
        <RelationalCatalogEmptyState />
      </section>
    );
  }

  const { activeCatalog, activePartner, orderLines } = catalog;

  return (
    <section
      data-testid="relational-commerce-catalog-shell"
      className="rcc-shell"
      data-actor={actorRole}
      data-no-global-marketplace="true"
    >
      <header className="rcc-header">
        <h2 className="rcc-title">Mon réseau commercial</h2>
        <p className="rcc-subtitle">
          Catalogues de vos partenaires — pas de marketplace ouverte.
        </p>
        {catalog.fallbackUsed ? (
          <span data-testid="rcc-data-fallback" className="rcc-hint">
            Données de démonstration
          </span>
        ) : null}
      </header>

      <RelationalCommercialContext context={catalog.view.context} />

      <PartnerList
        partners={catalog.view.partners}
        activeId={catalog.activeSupplierId}
        onSelect={catalog.setActiveSupplierId}
      />

      <RelationalCatalogDiscovery
        items={discoveries}
        onSelect={catalog.setActiveSupplierId}
      />

      {activeCatalog ? (
        <RelationalSupplierCatalog
          partner={
            activePartner ?? {
              id: activeCatalog.supplierId,
              displayName: activeCatalog.supplierType,
              partnerType: activeCatalog.supplierType,
              relationshipLevel: activeCatalog.relationshipLevel,
            }
          }
          catalog={activeCatalog}
          onQuickOrder={catalogCallbacks.onQuickOrder}
          onDiscuss={catalogCallbacks.onDiscuss}
          onAddToCart={catalog.addToOrder}
        />
      ) : (
        <RelationalCatalogEmptyState message="Sélectionnez un partenaire pour voir son catalogue." />
      )}

      <RelationalOrderComposer
        lines={orderLines}
        context={catalog.view.context}
        supplierId={catalog.activeSupplierId ?? ""}
        onSubmit={() => {
          if (catalog.activeSupplierId && orderLines[0]) {
            catalogCallbacks.onQuickOrder?.(catalog.activeSupplierId, orderLines[0].productId);
          }
          catalog.clearOrder();
        }}
        onClear={catalog.clearOrder}
      />
      {orderLines.length > 0 ? <RelationalOrderSummary lines={orderLines} /> : null}
    </section>
  );
}

export const RelationalCommerceCatalogShell = memo(RelationalCommerceCatalogShellInner);
