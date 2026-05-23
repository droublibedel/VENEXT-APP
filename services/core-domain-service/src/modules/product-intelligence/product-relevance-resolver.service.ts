import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";

export type RelevanceResolutionDto = {
  productId: string;
  retailerOrganizationId: string;
  relationshipId?: string;
  relevanceScore: number;
  recommendedVisibility: "standard" | "elevated" | "suppressed";
  sponsoredEligibility: boolean;
  rationale: string[];
};

/**
 * Relationship + category aware relevance — not open-market ranking (Instruction 6 §7).
 */
@Injectable()
export class ProductRelevanceResolverService {
  constructor(private readonly prisma: PrismaService) {}

  async resolve(input: {
    productId: string;
    retailerOrganizationId: string;
    relationshipId?: string;
    zoneCode?: string;
  }): Promise<RelevanceResolutionDto> {
    const [product, retailer, orders] = await Promise.all([
      this.prisma.product.findUnique({
        where: { id: input.productId },
        select: { category: true, sponsorEligible: true, organizationId: true },
      }),
      this.prisma.organization.findUnique({
        where: { id: input.retailerOrganizationId },
        select: { category: true, activityLabel: true, city: true, country: true },
      }),
      this.prisma.order.count({
        where: {
          buyerOrganizationId: input.retailerOrganizationId,
          items: { some: { productId: input.productId } },
        },
      }),
    ]);

    const rationale: string[] = [];
    let relevanceScore = 0.35;
    if (product && retailer) {
      const pCat = product.category.toLowerCase();
      const act = (retailer.activityLabel ?? "").toLowerCase();
      const catMatch =
        act.includes(pCat) || pCat.includes(act.slice(0, 6))
          ? 0.22
          : retailer.category.toString().includes("RETAILER") && pCat.length > 0
            ? 0.12
            : 0.06;
      relevanceScore += catMatch;
      rationale.push("Alignement catégorie / activité dans le graphe relationnel.");
    }
    relevanceScore += Math.min(0.35, orders * 0.05);
    if (orders > 0) {
      rationale.push("Historique de commandes relationnelles sur ce SKU.");
    }
    if (input.zoneCode) {
      relevanceScore += 0.05;
      rationale.push(`Zone ${input.zoneCode} — signal géographique intégré (stub).`);
    }
    relevanceScore = Math.min(0.98, relevanceScore);

    const recommendedVisibility =
      relevanceScore > 0.72 ? "elevated" : relevanceScore < 0.28 ? "suppressed" : "standard";

    const sponsoredEligibility = Boolean(product?.sponsorEligible && relevanceScore > 0.45);

    return {
      productId: input.productId,
      retailerOrganizationId: input.retailerOrganizationId,
      relationshipId: input.relationshipId,
      relevanceScore,
      recommendedVisibility,
      sponsoredEligibility,
      rationale,
    };
  }
}
