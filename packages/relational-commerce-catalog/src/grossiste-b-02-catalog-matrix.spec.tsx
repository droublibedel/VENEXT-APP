/** @vitest-environment jsdom */
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { auditGrossisteBCatalogIntegrity } from "./audit/grossiste-b-catalog-audits.js";
import { dispatchTerrainImages, resolveMultiImageQuestion } from "./terrain/dispatch-multi-images.js";
import { ProductVoiceDescription } from "terrain-commercial-audio";
import { QuickTerrainPublishFlow } from "./terrain/QuickTerrainPublishFlow.js";
import { TerrainRelationalProductCard } from "./terrain/TerrainRelationalProductCard.js";

afterEach(() => cleanup());

describe("GROSSISTE-B-02 catalogue", () => {
  it("auditGrossisteBCatalogIntegrity passes", () => {
    expect(auditGrossisteBCatalogIntegrity().every((f) => f.ok)).toBe(true);
  });

  it("image only product valid", () => {
    const p = dispatchTerrainImages(["x.jpg"], "same_article")[0]!;
    expect(p.imageUrl).toBe("x.jpg");
    expect(p.name).toBeUndefined();
  });

  it.each([2, 3, 5, 8])("same article gallery %i images", (n) => {
    const urls = Array.from({ length: n }, (_, i) => `i${i}.jpg`);
    const p = dispatchTerrainImages(urls, "same_article")[0]!;
    expect(p.galleryImageUrls).toHaveLength(n);
  });

  it.each([2, 3, 4])("different articles dispatch %i", (n) => {
    const urls = Array.from({ length: n }, (_, i) => `i${i}.jpg`);
    expect(dispatchTerrainImages(urls, "different_articles")).toHaveLength(n);
  });

  it("multi image question when >1", () => {
    expect(resolveMultiImageQuestion(2)).toContain("même article");
    expect(resolveMultiImageQuestion(1)).toBeNull();
  });

  it("TerrainRelationalProductCard image-first no empty labels", () => {
    render(<TerrainRelationalProductCard product={{ id: "p1", imageUrl: "a.jpg" }} />);
    expect(screen.getByTestId("rcc-terrain-image")).toBeTruthy();
    expect(screen.queryByText(/non renseigné/i)).toBeNull();
  });

  it("ProductVoiceDescription editor renders", () => {
    render(
      <ProductVoiceDescription productId="p1" ownerActorId="gb-1" mode="editor" />,
    );
    expect(screen.getByTestId("tca-product-voice-record-hold")).toBeTruthy();
  });

  it("QuickTerrainPublishFlow pick gallery", () => {
    render(<QuickTerrainPublishFlow onPublish={vi.fn()} />);
    fireEvent.click(screen.getByTestId("rcc-pick-gallery"));
    expect(screen.getByTestId("rcc-multi-image-question")).toBeTruthy();
  });

  it("publish blocked until dispatch chosen", () => {
    render(<QuickTerrainPublishFlow />);
    fireEvent.click(screen.getByTestId("rcc-pick-gallery"));
    expect(screen.getByTestId("rcc-publish-now")).toHaveProperty("disabled", true);
  });

  it.each(Array.from({ length: 20 }, (_, i) => i))("dispatch index %i", (i) => {
    const urls = [`a${i}.jpg`, `b${i}.jpg`];
    const products = dispatchTerrainImages(urls, "different_articles");
    expect(products).toHaveLength(2);
    expect(products[0]?.imageUrl).toBe(urls[0]);
  });
});
