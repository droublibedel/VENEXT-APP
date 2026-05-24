import { memo, useCallback, useMemo, useState } from "react";
import { buildVisibleCatalogBatch } from "commerce-performance-foundation";

import type { RelationalProduct } from "./relational-commerce-catalog.types";
import { RelationalProductCard } from "./RelationalProductCard";

export const RelationalCatalogSection = memo(function RelationalCatalogSection({
  title,
  products,
  supplierId,
  onQuickOrder,
  onDiscuss,
  onAddToCart,
  virtualizationEnabled = true,
}: {
  title: string;
  products: RelationalProduct[];
  supplierId: string;
  onQuickOrder?: (supplierId: string, productId: string) => void;
  onDiscuss?: (supplierId: string, productId: string) => void;
  onAddToCart?: (productId: string) => void;
  virtualizationEnabled?: boolean;
}) {
  const [offset, setOffset] = useState(0);

  const batch = useMemo(() => {
    if (!virtualizationEnabled || products.length <= 30) {
      return { batch: products, hasMore: false, nextOffset: products.length };
    }
    return buildVisibleCatalogBatch(products, offset);
  }, [products, offset, virtualizationEnabled]);

  const loadMore = useCallback(() => {
    setOffset((prev) => {
      const next = buildVisibleCatalogBatch(products, prev);
      return next.nextOffset;
    });
  }, [products]);

  if (products.length === 0) return null;
  return (
    <section className="rcc-section" data-testid={`rcc-section-${title.replace(/\s/g, "-").toLowerCase()}`}>
      <h3 className="rcc-section-title">{title}</h3>
      {batch.batch.map((p) => (
        <RelationalProductCard
          key={p.id}
          product={p}
          supplierId={supplierId}
          onQuickOrder={onQuickOrder}
          onDiscuss={onDiscuss}
          onAddToCart={onAddToCart}
        />
      ))}
      {batch.hasMore ? (
        <button
          type="button"
          data-testid="rcc-load-more-products"
          onClick={loadMore}
          style={{
            display: "block",
            width: "100%",
            marginTop: 8,
            padding: "10px 12px",
            fontSize: 13,
            border: "1px dashed #2a3530",
            background: "transparent",
            color: "#526059",
            borderRadius: 8,
          }}
        >
          Afficher plus de produits
        </button>
      ) : null}
    </section>
  );
});
