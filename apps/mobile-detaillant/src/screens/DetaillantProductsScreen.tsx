import { memo, useCallback, useMemo, useState } from "react";
import type { CommercialContextRoutingInput } from "commercial-context-routing";

import { DetaillantRelationalCatalog } from "../catalog/DetaillantRelationalCatalog";
import { DetaillantDataSourceBadge } from "../components/DetaillantDataSourceBadge";
import { useDetaillantFeatureFlags } from "../hooks/useDetaillantFeatureFlags";
import { DetaillantScreenHeader } from "../components/DetaillantScreenHeader";
import { DetaillantVirtualList } from "../components/DetaillantVirtualList";
import { buildDemandHints } from "../detaillant-intelligence";
import { useDetaillantProductsData } from "../hooks/useDetaillantProductsData";
import { DetaillantHintStrip } from "../widgets/DetaillantHintStrip";
import { DetaillantProductCard } from "../widgets/DetaillantProductCard";

export const DetaillantProductsScreen = memo(function DetaillantProductsScreen({
  enabled,
  routingInput,
}: {
  enabled: boolean;
  routingInput?: CommercialContextRoutingInput;
}) {
  const { flags, hydrated } = useDetaillantFeatureFlags();
  const relationalCatalog =
    hydrated && enabled && flags.relational_catalog_enabled !== false;
  const { data, loading, dataSource, fallbackUsed, refresh } = useDetaillantProductsData(
    enabled && !relationalCatalog,
  );
  const [query, setQuery] = useState("");
  const [cartCount, setCartCount] = useState(0);
  const [lastOrderId, setLastOrderId] = useState<string | null>(null);
  const hints = useMemo(() => buildDemandHints(data), [data]);

  const popular = useMemo(() => {
    const ids = new Set(data?.popularIds ?? []);
    return (data?.products ?? []).filter((p) => ids.has(p.id));
  }, [data]);

  const filtered = useMemo(() => {
    const products = data?.products ?? [];
    const popularIds = new Set(data?.popularIds ?? []);
    const q = query.trim().toLowerCase();
    const base = products.filter((p) => !popularIds.has(p.id));
    if (!q) return base;
    return base.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        p.city.toLowerCase().includes(q),
    );
  }, [data?.products, data?.popularIds, query]);

  const handleQuickOrder = useCallback((productId: string) => {
    setLastOrderId(productId);
  }, []);

  const handleAddToCart = useCallback((productId: string) => {
    setCartCount((c) => c + 1);
    setLastOrderId(productId);
  }, []);

  const renderCard = useCallback(
    (p: (typeof filtered)[number]) => (
      <DetaillantProductCard
        product={p}
        onQuickOrder={handleQuickOrder}
        onAddToCart={handleAddToCart}
      />
    ),
    [handleQuickOrder, handleAddToCart],
  );

  if (relationalCatalog) {
    return (
      <section data-testid="detaillant-screen-products">
        <DetaillantScreenHeader title="Marché" subtitle="Fournisseurs de votre réseau" />
        <DetaillantRelationalCatalog enabled={enabled} contextRouting={routingInput} />
      </section>
    );
  }

  return (
    <section data-testid="detaillant-screen-products">
      <DetaillantScreenHeader title="Marché" subtitle="Sourcing fournisseurs" onRefresh={refresh} refreshing={loading} />
      <DetaillantDataSourceBadge dataSource={dataSource} fallbackUsed={fallbackUsed} loading={loading} />
      <DetaillantHintStrip hints={hints} testId="detaillant-products-hints" />

      {cartCount > 0 || lastOrderId ? (
        <p
          className="detaillant-card"
          style={{ marginBottom: 12, fontSize: 13, color: "var(--venext-accent)" }}
          data-testid="detaillant-cart-status"
        >
          {cartCount > 0 ? `Panier : ${cartCount} article${cartCount > 1 ? "s" : ""}` : null}
          {lastOrderId ? ` · Dernière action : ${lastOrderId}` : null}
        </p>
      ) : null}

      <input
        className="detaillant-search"
        type="search"
        placeholder="Rechercher…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        data-testid="detaillant-products-search"
        aria-label="Recherche produits"
      />

      {popular.length > 0 ? (
        <>
          <h2 style={{ fontSize: 15, margin: "0 0 10px", color: "var(--venext-text-muted)", fontWeight: 600 }}>Populaires</h2>
          {popular.map((p) => (
            <DetaillantProductCard
              key={`pop-${p.id}`}
              product={p}
              onQuickOrder={handleQuickOrder}
              onAddToCart={handleAddToCart}
            />
          ))}
        </>
      ) : null}

      {data?.promotions?.length ? (
        <>
          <h2 style={{ fontSize: 15, margin: "16px 0 10px", color: "var(--venext-text-muted)", fontWeight: 600 }}>Promotions</h2>
          {data.promotions.map((promo) => (
            <article key={promo.id} className="detaillant-card" data-testid={`detaillant-promo-${promo.id}`}>
              <p style={{ margin: 0, fontSize: 14, color: "var(--venext-accent)" }}>{promo.label}</p>
            </article>
          ))}
        </>
      ) : null}

      <h2 style={{ fontSize: 15, margin: "16px 0 10px", color: "var(--venext-text-muted)", fontWeight: 600 }}>Tous les produits</h2>
      <DetaillantVirtualList
        items={filtered}
        keyExtractor={(p) => p.id}
        testId="detaillant-products-list"
        renderItem={renderCard}
      />

      {lastOrderId ? (
        <button
          type="button"
          className="detaillant-action detaillant-action--primary"
          style={{ width: "100%", marginTop: 16 }}
          data-testid="detaillant-checkout"
        >
          Passer commande
        </button>
      ) : null}
    </section>
  );
});
