import { memo, useState } from "react";

import { dispatchTerrainImages, resolveMultiImageQuestion } from "./dispatch-multi-images.js";
import type { MultiImageDispatchMode, TerrainProductDraft } from "./terrain-catalog.types.js";
import { ProductVoiceDescription } from "terrain-commercial-audio";
import { TerrainRelationalProductCard } from "./TerrainRelationalProductCard.js";

export const QuickTerrainPublishFlow = memo(function QuickTerrainPublishFlow({
  onPublish,
  testId = "rcc-quick-terrain-publish",
}: {
  onPublish?: (products: TerrainProductDraft[]) => void;
  testId?: string;
}) {
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [dispatchMode, setDispatchMode] = useState<MultiImageDispatchMode | null>(null);
  const [optionalText, setOptionalText] = useState("");
  const [voiceSec, setVoiceSec] = useState(0);

  const question = resolveMultiImageQuestion(imageUrls.length);

  const addImages = (urls: string[]) => {
    setImageUrls((prev) => [...prev, ...urls]);
    setDispatchMode(null);
  };

  const publish = () => {
    if (!imageUrls.length || !dispatchMode) return;
    const products = dispatchTerrainImages(imageUrls, dispatchMode).map((p) => ({
      ...p,
      name: optionalText || p.name,
      voiceDurationSec: voiceSec || undefined,
    }));
    onPublish?.(products);
    setImageUrls([]);
    setDispatchMode(null);
    setOptionalText("");
    setVoiceSec(0);
  };

  return (
    <section data-testid={testId} className="rcc-quick-publish">
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <button
          type="button"
          data-testid="rcc-pick-gallery"
          onClick={() => addImages([`img-${Date.now()}-a`, `img-${Date.now()}-b`])}
        >
          Galerie (multi)
        </button>
        <button
          type="button"
          data-testid="rcc-pick-camera"
          onClick={() => addImages([`cam-${Date.now()}`])}
        >
          Caméra
        </button>
      </div>
      {imageUrls.length ? (
        <div data-testid="rcc-publish-preview" style={{ display: "flex", gap: 4, flexWrap: "wrap", marginTop: 8 }}>
          {imageUrls.map((u) => (
            <div
              key={u}
              data-testid="rcc-publish-thumb"
              style={{ width: 72, height: 72, background: "#1a2420", borderRadius: 8 }}
            />
          ))}
        </div>
      ) : null}
      {question ? (
        <fieldset data-testid="rcc-multi-image-question" style={{ marginTop: 12, border: "none" }}>
          <legend style={{ fontSize: 13 }}>{question}</legend>
          <label>
            <input
              type="radio"
              name="dispatch"
              data-testid="rcc-same-article"
              checked={dispatchMode === "same_article"}
              onChange={() => setDispatchMode("same_article")}
            />{" "}
            Même article (galerie)
          </label>
          <label style={{ marginLeft: 12 }}>
            <input
              type="radio"
              name="dispatch"
              data-testid="rcc-different-articles"
              checked={dispatchMode === "different_articles"}
              onChange={() => setDispatchMode("different_articles")}
            />{" "}
            Articles différents
          </label>
        </fieldset>
      ) : null}
      <textarea
        data-testid="rcc-publish-optional-text"
        placeholder="Texte optionnel…"
        value={optionalText}
        onChange={(e) => setOptionalText(e.target.value)}
        rows={1}
        style={{ width: "100%", marginTop: 8 }}
      />
      {imageUrls[0] ? (
        <ProductVoiceDescription
          productId={`draft-${imageUrls[0]}`}
          ownerActorId="org-grossiste-b-demo"
          mode="editor"
          onChange={(rec) => setVoiceSec(rec?.durationSeconds ?? 0)}
        />
      ) : null}
      <button
        type="button"
        data-testid="rcc-publish-now"
        disabled={!imageUrls.length || (imageUrls.length > 1 && !dispatchMode)}
        onClick={publish}
        style={{ marginTop: 12, minHeight: 44, width: "100%" }}
      >
        Publier maintenant
      </button>
      {dispatchMode === "same_article" && imageUrls.length > 1 ? (
        <p data-testid="rcc-gallery-hint" style={{ fontSize: 11, color: "#8fa39a" }}>
          Galerie {imageUrls.length} images
        </p>
      ) : null}
    </section>
  );
});

export const TerrainCatalogGrid = memo(function TerrainCatalogGrid({
  products,
}: {
  products: TerrainProductDraft[];
}) {
  return (
    <div
      data-testid="rcc-terrain-catalog-grid"
      style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 8 }}
    >
      {products.map((p) => (
        <TerrainRelationalProductCard key={p.id} product={p} />
      ))}
    </div>
  );
});
