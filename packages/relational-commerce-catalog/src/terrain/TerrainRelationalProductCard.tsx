import { memo } from "react";

import {
  ProductVoiceDescription,
  buildProductMessagingContext,
  VenextAudioSpeakerButton,
} from "terrain-commercial-audio";

import type { TerrainProductDraft } from "./terrain-catalog.types.js";

/** Image-first + haut-parleur si audio (GROSSISTE-B-03). */
export const TerrainRelationalProductCard = memo(function TerrainRelationalProductCard({
  product,
  supplierId,
  relationshipId,
  viewerMode = false,
  onDiscuss,
}: {
  product: TerrainProductDraft;
  supplierId?: string;
  relationshipId?: string;
  viewerMode?: boolean;
  onDiscuss?: (ctx: { productId: string; supplierId: string }) => void;
}) {
  const hasMeta = Boolean(
    product.name || product.priceLabel || product.category || product.size || product.color,
  );

  const hasAudio = Boolean(product.voiceDescriptionId && product.voiceDurationSec);

  return (
    <article data-testid={`rcc-terrain-product-${product.id}`} className="rcc-terrain-card">
      <div
        data-testid="rcc-terrain-image"
        style={{
          aspectRatio: "3/4",
          background: `center/cover url(${product.imageUrl}) #1a2420`,
          borderRadius: 10,
          minHeight: 160,
          position: "relative",
        }}
      >
        {hasAudio && viewerMode && product.voiceDescriptionId ? (
          <div style={{ position: "absolute", bottom: 8, left: 8 }}>
            <VenextAudioSpeakerButton
              audioId={product.voiceDescriptionId}
              audioUrl={product.voiceDescriptionUrl}
              durationSeconds={product.voiceDurationSec}
              testId={`rcc-product-speaker-${product.id}`}
            />
          </div>
        ) : null}
      </div>
      {product.galleryImageUrls && product.galleryImageUrls.length > 1 ? (
        <span data-testid="rcc-terrain-gallery-badge" style={{ fontSize: 10, color: "#00a884" }}>
          +{product.galleryImageUrls.length - 1} photos
        </span>
      ) : null}
      {hasMeta ? (
        <div data-testid="rcc-terrain-meta" style={{ padding: "6px 4px" }}>
          {product.name ? <p style={{ margin: 0, fontSize: 13, fontWeight: 600 }}>{product.name}</p> : null}
          {product.priceLabel ? (
            <p style={{ margin: "2px 0 0", fontSize: 12, color: "#00a884" }}>{product.priceLabel}</p>
          ) : null}
        </div>
      ) : null}
      {!viewerMode && supplierId ? (
        <ProductVoiceDescription
          productId={product.id}
          ownerActorId={supplierId}
          mode="editor"
          testId={`rcc-product-voice-editor-${product.id}`}
        />
      ) : null}
      {viewerMode && onDiscuss && supplierId ? (
        <button
          type="button"
          data-testid={`rcc-terrain-discuss-${product.id}`}
          className="rcc-btn"
          style={{ marginTop: 8, width: "100%", minHeight: 44 }}
          onClick={() => {
            buildProductMessagingContext({
              productId: product.id,
              productImage: product.imageUrl,
              productAudioDescriptionId: product.voiceDescriptionId,
              supplierId,
              relationshipId,
            });
            onDiscuss({ productId: product.id, supplierId });
          }}
        >
          Messagerie / négociation
        </button>
      ) : null}
    </article>
  );
});
