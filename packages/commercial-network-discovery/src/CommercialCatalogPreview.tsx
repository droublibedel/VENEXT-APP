import { memo } from "react";

import type { CommercialCatalogPreviewData } from "./commercial-network-discovery.types";

export const CommercialCatalogPreview = memo(function CommercialCatalogPreview({
  catalog,
  visible,
}: {
  catalog: CommercialCatalogPreviewData | null;
  visible: boolean;
}) {
  if (!visible || !catalog) {
    return (
      <section data-testid="cnd-catalog-preview-hidden" className="cnd-panel-hidden" aria-hidden />
    );
  }

  return (
    <section className="cnd-card" data-testid="cnd-catalog-preview">
      <h3 style={{ margin: "0 0 4px", fontSize: 13 }}>Catalogue — {catalog.partnerName}</h3>
      {catalog.popularLabel ? (
        <p style={{ margin: "0 0 8px", fontSize: 10, color: "#00a884" }}>{catalog.popularLabel}</p>
      ) : null}
      {catalog.promotionLabel ? (
        <p style={{ margin: "0 0 8px", fontSize: 10, color: "#8fa39a" }}>{catalog.promotionLabel}</p>
      ) : null}
      <ul style={{ margin: 0, padding: 0, listStyle: "none" }}>
        {catalog.products.map((p) => (
          <li
            key={p.id}
            style={{
              padding: "8px 0",
              borderBottom: "1px solid rgba(0,168,132,0.08)",
              fontSize: 12,
            }}
            data-testid={`cnd-catalog-product-${p.id}`}
          >
            <span style={{ fontWeight: 600 }}>{p.name}</span>
            <span style={{ display: "block", fontSize: 10, color: "#8fa39a", marginTop: 2 }}>
              {p.priceLabel} · {p.availability === "available" ? "Disponible" : p.availability === "limited" ? "Stock limité" : "Indisponible"}
              {p.badge ? ` · ${p.badge}` : ""}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
});
