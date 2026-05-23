import type { MultiImageDispatchMode, TerrainProductDraft } from "./terrain-catalog.types.js";

export function resolveMultiImageQuestion(imageCount: number): string | null {
  if (imageCount <= 1) return null;
  return "Ces images représentent le même article ou des articles différents ?";
}

/** CAS A : galerie — CAS B : un produit par image. */
export function dispatchTerrainImages(
  imageUrls: string[],
  mode: MultiImageDispatchMode,
): TerrainProductDraft[] {
  if (!imageUrls.length) return [];
  if (mode === "same_article") {
    return [
      {
        id: `terrain-${Date.now()}`,
        imageUrl: imageUrls[0]!,
        galleryImageUrls: imageUrls,
      },
    ];
  }
  return imageUrls.map((url, i) => ({
    id: `terrain-${Date.now()}-${i}`,
    imageUrl: url,
  }));
}
