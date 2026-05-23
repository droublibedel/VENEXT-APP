import type { FeedEntry } from "./relational-feed.types.js";

/** Contenus bootstrap VENEXT — lancement réaliste (GROSSISTE-B-04). */
export function officialBootstrapCommercialContent(city = "Abidjan"): FeedEntry[] {
  const now = Date.now();
  const items: Array<{
    id: string;
    name: string;
    role: string;
    activity: string;
    img: string;
    previews: string[];
  }> = [
    {
      id: "boot-chaussures-adjame",
      name: "Chaussures Adjamé Plus",
      role: "Grossiste",
      activity: "chaussures",
      img: "https://mock.venext.ci/bootstrap/shoes.jpg",
      previews: ["https://mock.venext.ci/bootstrap/shoe1.jpg", "https://mock.venext.ci/bootstrap/shoe2.jpg"],
    },
    {
      id: "boot-sacs-plateau",
      name: "Sacs & Maroquinerie Plateau",
      role: "Grossiste",
      activity: "sacs",
      img: "https://mock.venext.ci/bootstrap/bags.jpg",
      previews: ["https://mock.venext.ci/bootstrap/bag1.jpg"],
    },
    {
      id: "boot-vetements-yop",
      name: "Mode Yopougon",
      role: "Grossiste",
      activity: "vêtements",
      img: "https://mock.venext.ci/bootstrap/clothes.jpg",
      previews: ["https://mock.venext.ci/bootstrap/cloth1.jpg", "https://mock.venext.ci/bootstrap/cloth2.jpg"],
    },
    {
      id: "boot-cosmetiques",
      name: "Beauté Terrain CI",
      role: "Grossiste",
      activity: "cosmétiques",
      img: "https://mock.venext.ci/bootstrap/cosmetics.jpg",
      previews: ["https://mock.venext.ci/bootstrap/cos1.jpg"],
    },
    {
      id: "boot-phones",
      name: "Mobile Marché",
      role: "Grossiste",
      activity: "téléphones",
      img: "https://mock.venext.ci/bootstrap/phones.jpg",
      previews: ["https://mock.venext.ci/bootstrap/ph1.jpg"],
    },
    {
      id: "boot-accessoires",
      name: "Accessoires Commerce",
      role: "Détaillant",
      activity: "accessoires",
      img: "https://mock.venext.ci/bootstrap/acc.jpg",
      previews: [],
    },
  ];

  return items.map((it, i) => ({
    id: `bootstrap-${it.id}`,
    type: "BOOTSTRAP" as const,
    layer: "DISCOVERY_SUGGESTIONS" as const,
    partnerId: it.id,
    displayName: it.name,
    partnerRoleLabel: it.role,
    city,
    activityCategory: it.activity,
    imageUrl: it.img,
    catalogPreviewUrls: it.previews,
    proximityScore: 50 - i,
    publishedAt: new Date(now - i * 3600_000).toISOString(),
    inviteable: true,
    sponsored: false,
  }));
}
