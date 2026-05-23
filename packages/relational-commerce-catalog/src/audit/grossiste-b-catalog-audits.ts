import { dispatchTerrainImages } from "../terrain/dispatch-multi-images.js";

export type CatalogAuditFinding = { code: string; ok: boolean };

export function auditGrossisteBCatalogIntegrity(): CatalogAuditFinding[] {
  const same = dispatchTerrainImages(["a.jpg", "b.jpg"], "same_article");
  const diff = dispatchTerrainImages(["a.jpg", "b.jpg"], "different_articles");
  return [
    { code: "IMAGE_ONLY_PRODUCT_VALID", ok: Boolean(same[0]?.imageUrl) },
    { code: "SAME_ARTICLE_GALLERY", ok: (same[0]?.galleryImageUrls?.length ?? 0) === 2 },
    { code: "DIFFERENT_ARTICLES_DISPATCH", ok: diff.length === 2 },
    { code: "NO_REQUIRED_TEXT_FIELDS", ok: !same[0]?.name || same[0]?.name === undefined },
  ];
}
