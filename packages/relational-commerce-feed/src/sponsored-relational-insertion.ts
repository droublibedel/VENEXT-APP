import { isCommerciallyCompatible } from "./commercial-interest-proximity-engine.js";
import type { FeedEntry } from "./relational-feed.types.js";

export function buildSponsoredRelationalEntries(
  viewerActivity: string,
  city?: string,
): FeedEntry[] {
  const pool: FeedEntry[] = [
    {
      id: "sp-rel-1",
      type: "SPONSORED",
      layer: "SPONSORED_RELATIONAL_CONTENT",
      partnerId: "sp-grossiste-chaussures",
      displayName: "Grossiste Chaussures Pro",
      partnerRoleLabel: "Grossiste",
      city: city ?? "Abidjan",
      activityCategory: "chaussures",
      imageUrl: "https://mock.venext.ci/sponsored/shoes.jpg",
      catalogPreviewUrls: ["https://mock.venext.ci/sponsored/s1.jpg"],
      proximityScore: 45,
      publishedAt: new Date().toISOString(),
      inviteable: true,
      sponsored: true,
    },
    {
      id: "sp-rel-2",
      type: "SPONSORED",
      layer: "SPONSORED_RELATIONAL_CONTENT",
      partnerId: "sp-sacs-mode",
      displayName: "Sacs Mode Distribution",
      partnerRoleLabel: "Grossiste",
      city: city ?? "Abidjan",
      activityCategory: "sacs",
      imageUrl: "https://mock.venext.ci/sponsored/bags.jpg",
      proximityScore: 40,
      publishedAt: new Date().toISOString(),
      inviteable: true,
      sponsored: true,
    },
    {
      id: "sp-rel-3",
      type: "SPONSORED",
      layer: "SPONSORED_RELATIONAL_CONTENT",
      partnerId: "sp-vetements",
      displayName: "Textile Commerce",
      partnerRoleLabel: "Grossiste",
      city: "Bouaké",
      activityCategory: "vêtements",
      imageUrl: "https://mock.venext.ci/sponsored/cloth.jpg",
      proximityScore: 38,
      publishedAt: new Date().toISOString(),
      inviteable: true,
      sponsored: true,
    },
    {
      id: "sp-rel-bad",
      type: "SPONSORED",
      layer: "SPONSORED_RELATIONAL_CONTENT",
      partnerId: "sp-matelas",
      displayName: "Matelas Industrie",
      partnerRoleLabel: "Grossiste",
      city: "Abidjan",
      activityCategory: "matelas",
      imageUrl: "https://mock.venext.ci/sponsored/bad.jpg",
      proximityScore: 5,
      publishedAt: new Date().toISOString(),
      inviteable: true,
      sponsored: true,
    },
  ];

  return pool.filter((e) => isCommerciallyCompatible(viewerActivity, e.activityCategory));
}

export const SponsoredRelationalInsertion = {
  build: buildSponsoredRelationalEntries,
};
