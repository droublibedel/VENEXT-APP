import { forwardRef, Inject, Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import type { SponsoredInjectionListInput } from "../relational-commerce/sponsored-injection-engine.service";
import { SponsoredInjectionEngineService } from "../relational-commerce/sponsored-injection-engine.service";

export type SponsoredEvaluationDto = {
  allowed: boolean;
  reasons: string[];
  categoryCompatible: boolean;
  relationshipAware: boolean;
};

/**
 * Rules-first sponsored injection — listing delegates to {@link SponsoredInjectionEngineService} (Instruction 9B).
 */
@Injectable()
export class SponsoredVisibilityEngineService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(forwardRef(() => SponsoredInjectionEngineService))
    private readonly canonicalInjection: SponsoredInjectionEngineService,
  ) {}

  listActiveInjections(input: SponsoredInjectionListInput = {}) {
    return this.canonicalInjection.listActiveInjections(input);
  }

  async evaluate(input: {
    injectionId?: string;
    productId: string;
    retailerOrganizationId: string;
    relationshipId?: string;
  }): Promise<SponsoredEvaluationDto> {
    const product = await this.prisma.product.findUnique({
      where: { id: input.productId },
      select: { category: true, sponsorEligible: true },
    });
    if (!product) {
      return {
        allowed: false,
        reasons: ["Produit inconnu"],
        categoryCompatible: false,
        relationshipAware: false,
      };
    }

    const injection = input.injectionId
      ? await this.prisma.sponsoredProductInjection.findUnique({
          where: { id: input.injectionId },
        })
      : await this.prisma.sponsoredProductInjection.findFirst({
          where: {
            productId: input.productId,
            active: true,
            OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
          },
        });

    if (!injection) {
      return {
        allowed: false,
        reasons: ["Aucune règle d’injection active pour ce SKU"],
        categoryCompatible: false,
        relationshipAware: false,
      };
    }

    const retailer = await this.prisma.organization.findUnique({
      where: { id: input.retailerOrganizationId },
      select: { activityLabel: true },
    });

    const catNorm = (s: string) => s.toLowerCase().trim();
    const categoryCompatible = catNorm(product.category) === catNorm(injection.targetCommercialCategory);

    const relationshipAware = Boolean(
      !injection.relationshipId ||
        (input.relationshipId != null && injection.relationshipId === input.relationshipId),
    );

    const allowed =
      categoryCompatible &&
      relationshipAware &&
      product.sponsorEligible &&
      injection.active;

    const reasons: string[] = [];
    if (!categoryCompatible) {
      reasons.push("Catégorie commerciale non compatible avec la règle d’injection.");
    }
    if (!relationshipAware) {
      reasons.push("Hors périmètre relationnel autorisé pour cette injection.");
    }
    if (!product.sponsorEligible) {
      reasons.push("SKU non marqué sponsorisable par le producteur.");
    }
    if (allowed) {
      reasons.push("Injection contextuelle autorisée sur le réseau compatible.");
    }

    return { allowed, reasons, categoryCompatible, relationshipAware };
  }
}
