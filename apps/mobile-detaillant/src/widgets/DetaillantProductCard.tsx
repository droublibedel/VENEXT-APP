import { memo } from "react";

import type { DetaillantProduct, ProductBadge } from "../hooks/detaillant-data.types";
import { detaillantProductConversationSettings } from "../messaging/detaillant-product-governance";

function badgeLabel(badge?: ProductBadge): string | null {
  if (badge === "disponible") return "Disponible";
  if (badge === "tres-demande") return "Très demandé";
  if (badge === "stock-limite") return "Stock limité";
  return null;
}

function badgeClass(badge?: ProductBadge): string {
  if (badge === "tres-demande") return "detaillant-badge detaillant-badge--hot";
  if (badge === "stock-limite") return "detaillant-badge detaillant-badge--low";
  return "detaillant-badge detaillant-badge--ok";
}

export const DetaillantProductCard = memo(function DetaillantProductCard({
  product,
  onQuickOrder,
  onAddToCart,
  onDiscuss,
}: {
  product: DetaillantProduct;
  onQuickOrder?: (productId: string) => void;
  onAddToCart?: (productId: string) => void;
  onDiscuss?: (productId: string) => void;
}) {
  const bl = badgeLabel(product.badge);
  const mode = detaillantProductConversationSettings(product).conversationMode;
  const quickBuy = mode === "FIXED_PRICE_ONLY" && product.availability !== "out";
  const negotiable = mode === "NEGOTIABLE";
  const disabled = mode === "DISABLED";

  return (
    <article className="detaillant-card" data-testid={`detaillant-product-${product.id}`}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
        <div>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>{product.name}</h3>
          <p style={{ margin: "6px 0 0", fontSize: 13, color: "var(--venext-text-muted)" }}>
            {product.category} · {product.city}
          </p>
        </div>
        {bl ? <span className={badgeClass(product.badge)}>{bl}</span> : null}
      </div>
      <p style={{ margin: "12px 0 0", fontSize: 18, fontWeight: 800 }}>{product.priceLabel}</p>
      {product.promotion ? (
        <p style={{ margin: "8px 0 0", fontSize: 13, color: "var(--venext-accent)" }}>{product.promotion}</p>
      ) : null}

      {!disabled ? (
        <div
          className="detaillant-product-actions"
          data-testid={`detaillant-product-actions-${product.id}`}
          data-commerce-mode={mode}
        >
          {quickBuy ? (
            <>
              <button
                type="button"
                className="detaillant-action detaillant-action--primary"
                data-testid={`detaillant-quick-order-${product.id}`}
                onClick={() => onQuickOrder?.(product.id)}
              >
                Commander
              </button>
              <button
                type="button"
                className="detaillant-action"
                data-testid={`detaillant-add-cart-${product.id}`}
                onClick={() => onAddToCart?.(product.id)}
              >
                Ajouter panier
              </button>
            </>
          ) : null}
          {negotiable ? (
            <>
              <button
                type="button"
                className="detaillant-action"
                data-testid={`detaillant-discuss-${product.id}`}
                onClick={() => onDiscuss?.(product.id)}
              >
                Discuter
              </button>
              <button
                type="button"
                className="detaillant-action detaillant-action--secondary"
                data-testid={`detaillant-negotiate-${product.id}`}
                onClick={() => onDiscuss?.(product.id)}
              >
                Négocier produit
              </button>
            </>
          ) : null}
        </div>
      ) : (
        <p style={{ margin: "12px 0 0", fontSize: 12, color: "var(--venext-text-muted)" }}>Indisponible</p>
      )}
    </article>
  );
});
