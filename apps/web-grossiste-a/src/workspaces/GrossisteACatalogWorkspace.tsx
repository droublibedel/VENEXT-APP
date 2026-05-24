import { memo, useMemo, useState } from "react";
import type { CommercialContextRoutingInput } from "commercial-context-routing";

import { GrossisteARelationalCatalog } from "../catalog/GrossisteARelationalCatalog";
import { GrossisteAVirtualList } from "../components/GrossisteAVirtualList";
import { useGrossisteAFeatureFlags } from "../hooks/useGrossisteAFeatureFlags";
import { GrossisteAWorkspaceFrame } from "../components/GrossisteAWorkspaceFrame";
import { useGrossisteACatalogData } from "../hooks/useGrossisteACatalogData";

export const GrossisteACatalogWorkspace = memo(function GrossisteACatalogWorkspace({
  enabled,
  routingInput,
}: {
  enabled: boolean;
  routingInput?: CommercialContextRoutingInput;
}) {
  const { flags, hydrated } = useGrossisteAFeatureFlags();
  const relationalCatalog =
    hydrated && enabled && flags.relational_catalog_enabled !== false;
  const { data, loading, dataSource, fallbackUsed, refresh } = useGrossisteACatalogData(
    enabled && !relationalCatalog,
  );
  const [q, setQ] = useState("");
  const filtered = useMemo(() => {
    const products = data?.products ?? [];
    const query = q.trim().toLowerCase();
    if (!query) return products;
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(query) ||
        p.category.toLowerCase().includes(query),
    );
  }, [data?.products, q]);

  if (relationalCatalog) {
    return (
      <GrossisteAWorkspaceFrame
        title="Catalogue"
        subtitle="Catalogues partenaires — réseau fermé"
        loading={loading}
        onRefresh={refresh}
        dataSource={dataSource}
        fallbackUsed={fallbackUsed}
        testId="ga-workspace-catalog"
      >
        <GrossisteARelationalCatalog enabled={enabled} contextRouting={routingInput} />
      </GrossisteAWorkspaceFrame>
    );
  }

  return (
    <GrossisteAWorkspaceFrame
      title="Catalogue"
      subtitle="Produits actifs et rotation"
      loading={loading}
      onRefresh={refresh}
      dataSource={dataSource}
      fallbackUsed={fallbackUsed}
      testId="ga-workspace-catalog"
    >
      <input
        className="ga-search"
        type="search"
        placeholder="Rechercher un produit…"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        data-testid="ga-catalog-search"
      />
      <GrossisteAVirtualList
        items={filtered}
        keyExtractor={(p) => p.id}
        testId="ga-catalog-list"
        renderItem={(p) => (
          <article className="ga-card" data-testid={`ga-product-${p.id}`}>
            <strong>{p.name}</strong>
            <p style={{ margin: "6px 0 0", fontSize: 13, color: "#526059" }}>
              {p.category} · {p.availability} · rotation {p.rotation}
            </p>
            <p style={{ margin: "6px 0 0", color: p.demand === "high" ? "#00a884" : p.demand === "slow" ? "#e8b84a" : "#526059" }}>
              {p.demand === "high" ? "Forte demande" : p.demand === "slow" ? "Ralentit" : "Demande normale"}
            </p>
          </article>
        )}
      />
    </GrossisteAWorkspaceFrame>
  );
});
