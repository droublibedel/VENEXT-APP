import { memo } from "react";

import { buildProductMessagingContext, VenextAudioSpeakerButton } from "terrain-commercial-audio";

import type { RelationalProduct } from "./relational-commerce-catalog.types";

export const RelationalProductCard = memo(function RelationalProductCard({
  product,
  supplierId,
  relationshipId,
  onQuickOrder,
  onDiscuss,
  onAddToCart,
}: {
  product: RelationalProduct;
  supplierId: string;
  relationshipId?: string;
  onQuickOrder?: (supplierId: string, productId: string) => void;
  onDiscuss?: (supplierId: string, productId: string) => void;
  onAddToCart?: (productId: string) => void;
}) {
  const hasAudio = Boolean(product.voiceDescriptionId && product.voiceDescriptionUrl);

  return (
    <article className="rcc-product-card" data-testid={`rcc-product-${product.id}`}>
      {product.imageUrl ? (
        <div
          data-testid={`rcc-product-image-${product.id}`}
          style={{
            aspectRatio: "1",
            marginBottom: 8,
            borderRadius: 8,
            background: `center/cover url(${product.imageUrl}) #1a2420`,
            minHeight: 120,
            position: "relative",
          }}
        >
          {hasAudio ? (
            <div style={{ position: "absolute", bottom: 6, left: 6 }}>
              <VenextAudioSpeakerButton
                audioId={product.voiceDescriptionId!}
                audioUrl={product.voiceDescriptionUrl}
                durationSeconds={product.voiceDurationSec}
                testId={`rcc-product-speaker-${product.id}`}
              />
            </div>
          ) : null}
        </div>
      ) : hasAudio ? (
        <VenextAudioSpeakerButton
          audioId={product.voiceDescriptionId!}
          audioUrl={product.voiceDescriptionUrl}
          durationSeconds={product.voiceDurationSec}
          testId={`rcc-product-speaker-${product.id}`}
        />
      ) : null}
      {product.name ? <p className="rcc-product-name">{product.name}</p> : null}
      {(product.category || product.priceLabel) ? (
        <p className="rcc-product-meta">
          {[product.category, product.priceLabel].filter(Boolean).join(" · ")}
          {product.availability === "limited" ? " · Stock limité" : ""}
        </p>
      ) : null}
      {product.promoLabel ? (
        <p className="rcc-product-promo" data-testid={`rcc-promo-${product.id}`}>
          {product.promoLabel}
        </p>
      ) : null}
      <div className="rcc-product-actions">
        {onQuickOrder ? (
          <button
            type="button"
            className="rcc-btn rcc-btn--primary"
            data-testid={`rcc-quick-order-${product.id}`}
            onClick={() => onQuickOrder(supplierId, product.id)}
          >
            Commande rapide
          </button>
        ) : null}
        {onAddToCart ? (
          <button
            type="button"
            className="rcc-btn"
            data-testid={`rcc-add-cart-${product.id}`}
            onClick={() => onAddToCart(product.id)}
          >
            Panier
          </button>
        ) : null}
        {onDiscuss ? (
          <button
            type="button"
            className="rcc-btn"
            data-testid={`rcc-discuss-${product.id}`}
            onClick={() => {
              buildProductMessagingContext({
                productId: product.id,
                productImage: product.imageUrl,
                productAudioDescriptionId: product.voiceDescriptionId,
                supplierId,
                relationshipId,
              });
              onDiscuss(supplierId, product.id);
            }}
          >
            Discuter
          </button>
        ) : null}
      </div>
    </article>
  );
});
