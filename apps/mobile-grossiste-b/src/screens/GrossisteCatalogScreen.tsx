import { memo, useMemo, useState } from "react";
import type { CommercialContextRoutingInput } from "commercial-context-routing";

import { GrossisteBRelationalCatalog } from "../catalog/GrossisteBRelationalCatalog";
import { GrossisteDataSourceBadge } from "../components/GrossisteDataSourceBadge";
import { useGrossisteFeatureFlags } from "../hooks/useGrossisteFeatureFlags";
import { GrossisteScreenHeader } from "../components/GrossisteScreenHeader";
import { GrossisteVirtualList } from "../components/GrossisteVirtualList";
import { useGrossisteCatalogData } from "../hooks/useGrossisteCatalogData";
import { buildDemandSignals, buildStockSignals } from "../mocks/grossiste-b-intelligence";
import { GrossisteHintStrip } from "../widgets/GrossisteHintStrip";
import { GrossisteProductCard } from "../widgets/GrossisteProductCard";

export const GrossisteCatalogScreen = memo(function GrossisteCatalogScreen({
  enabled,
  routingInput,
}: {
  enabled: boolean;
  routingInput?: CommercialContextRoutingInput;
}) {
  const { flags, hydrated } = useGrossisteFeatureFlags();
  const relationalCatalog =
    hydrated && enabled && flags.relational_catalog_enabled !== false;
  const { data, loading, dataSource, fallbackUsed, refresh } = useGrossisteCatalogData(
    enabled && !relationalCatalog,
  );
  const [query, setQuery] = useState("");
  const demandHints = useMemo(() => buildDemandSignals(data), [data]);
  const stockHints = useMemo(() => buildStockSignals(data), [data]);
  const hints = useMemo(() => [...demandHints, ...stockHints].slice(0, 3), [demandHints, stockHints]);

  const filtered = useMemo(() => {
    const products = data?.products ?? [];
    const q = query.trim().toLowerCase();
    if (!q) return products;
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        p.city.toLowerCase().includes(q),
    );
  }, [data?.products, query]);

  const popular = useMemo(() => {
    const ids = new Set(data?.popularIds ?? []);
    return (data?.products ?? []).filter((p) => ids.has(p.id));
  }, [data]);

  if (relationalCatalog) {
    return (
      <section data-testid="grossiste-screen-catalog">
        <GrossisteScreenHeader title="Catalogue" subtitle="Réseau commercial — partenaires" />
        <GrossisteBRelationalCatalog enabled={enabled} contextRouting={routingInput} />
      </section>
    );
  }

  return (
    <section data-testid="grossiste-screen-catalog">
      <GrossisteScreenHeader title="Catalogue" subtitle="Vos produits terrain" onRefresh={refresh} refreshing={loading} />
      <GrossisteDataSourceBadge dataSource={dataSource} fallbackUsed={fallbackUsed} loading={loading} />
      <GrossisteHintStrip hints={hints} testId="grossiste-catalog-hints" />

      <input
        className="grossiste-b-search"
        type="search"
        placeholder="Rechercher un produit…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        data-testid="grossiste-catalog-search"
        aria-label="Recherche catalogue"
      />

      {popular.length > 0 ? (
        <>
          <h2 style={{ fontSize: 14, margin: "0 0 8px", color: "var(--venext-text-muted)" }}>Populaires</h2>
          {popular.map((p) => (
            <GrossisteProductCard key={`pop-${p.id}`} product={p} />
          ))}
        </>
      ) : null}

      {data?.promotions?.length ? (
        <>
          <h2 style={{ fontSize: 14, margin: "16px 0 8px", color: "var(--venext-text-muted)" }}>Promotions</h2>
          {data.promotions.map((promo) => (
            <article key={promo.id} className="grossiste-b-card" data-testid={`grossiste-promo-${promo.id}`}>
              <p style={{ margin: 0, fontSize: 13, color: "var(--venext-accent)" }}>{promo.label}</p>
            </article>
          ))}
        </>
      ) : null}

      <h2 style={{ fontSize: 14, margin: "16px 0 8px", color: "var(--venext-text-muted)" }}>Tous les produits</h2>
      <GrossisteVirtualList
        items={filtered}
        keyExtractor={(p) => p.id}
        testId="grossiste-catalog-list"
        renderItem={(p) => <GrossisteProductCard product={p} />}
      />
    </section>
  );
});
