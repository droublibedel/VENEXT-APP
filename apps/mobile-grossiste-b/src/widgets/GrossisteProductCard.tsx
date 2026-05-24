import { memo } from "react";

import type { GrossisteCatalogProduct, ProductBadge } from "../hooks/grossiste-b-data.types";

function badgeLabel(badge?: ProductBadge): string | null {
  if (badge === "forte-demande") return "Forte demande";
  if (badge === "rotation-rapide") return "Rotation rapide";
  if (badge === "stock-limite") return "Stock limité";
  return null;
}

function badgeClass(badge?: ProductBadge): string {
  if (badge === "forte-demande") return "grossiste-b-badge grossiste-b-badge--demand";
  if (badge === "rotation-rapide") return "grossiste-b-badge grossiste-b-badge--fast";
  if (badge === "stock-limite") return "grossiste-b-badge grossiste-b-badge--stock";
  return "grossiste-b-badge";
}

export const GrossisteProductCard = memo(function GrossisteProductCard({
  product,
}: {
  product: GrossisteCatalogProduct;
}) {
  const bl = badgeLabel(product.badge);
  return (
    <article className="grossiste-b-card" data-testid={`grossiste-product-${product.id}`}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "flex-start" }}>
        <div>
          <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600 }}>{product.name}</h3>
          <p style={{ margin: "4px 0 0", fontSize: 12, color: "var(--venext-text-muted)" }}>
            {product.category} · {product.city}
          </p>
        </div>
        {bl ? <span className={badgeClass(product.badge)}>{bl}</span> : null}
      </div>
      <p style={{ margin: "10px 0 0", fontSize: 16, fontWeight: 700, color: "var(--venext-text)" }}>{product.priceLabel}</p>
      {product.promotion ? (
        <p style={{ margin: "6px 0 0", fontSize: 12, color: "var(--venext-accent)" }}>{product.promotion}</p>
      ) : null}
      <p style={{ margin: "6px 0 0", fontSize: 11, color: "var(--venext-text-muted)" }}>
        {product.availability === "available"
          ? "Disponible"
          : product.availability === "limited"
            ? "Stock limité"
            : "Indisponible"}
      </p>
    </article>
  );
});
