import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { CatalogType, OrganizationCategory, RelationshipStatus } from "@prisma/client";
import { Prisma } from "@prisma/client";
import {
  assertCatalogueAccess,
  assertMarketAccess,
  buildTransferAnalyticsPayload,
  resolveActorEconomicRole,
} from "commerce-economic-lanes";

import { PrismaService } from "../../prisma/prisma.service";
import { WholesalerDualCatalogService } from "../relational-commerce/wholesaler-dual-catalog.service";
import { resolveCommerceOrganizationId } from "./resolve-demo-organization";

type ProductDto = {
  id: string;
  name: string;
  description: string;
  category: string;
  imageUrls: string[];
  unitLabel: string;
  basePrice: number | null;
  currency: string;
  supplierName?: string;
  supplierOrganizationId?: string;
  relationshipId?: string;
  sourceProductId?: string;
  inherited?: boolean;
  audioDescriptionUrl?: string | null;
  minOrderQuantity?: number | null;
  tags?: string[];
};

@Injectable()
export class CommerceMarketCatalogService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly dualCatalog: WholesalerDualCatalogService,
  ) {}

  private resolveCategoryRole(category: OrganizationCategory): string {
    if (category === OrganizationCategory.PRODUCER) return "PRODUCER";
    if (category === OrganizationCategory.WHOLESALER_A || category === OrganizationCategory.WHOLESALER_B) {
      return "GROSSISTE_B";
    }
    if (category === OrganizationCategory.RETAILER) return "DETAILLANT";
    return category;
  }

  private mapProduct(p: {
    id: string;
    name: string;
    description: string;
    category: string;
    imageUrls: string[];
    unitLabel: string;
    basePrice: Prisma.Decimal | null;
    currency: string;
  }): ProductDto {
    return {
      id: p.id,
      name: p.name,
      description: p.description,
      category: p.category,
      imageUrls: [...p.imageUrls],
      unitLabel: p.unitLabel,
      basePrice: p.basePrice ? Number(p.basePrice) : null,
      currency: p.currency,
    };
  }

  private orgId(organizationId: string): string {
    return resolveCommerceOrganizationId(organizationId);
  }

  async ensureCatalogueOwnership(organizationId: string) {
    const resolvedId = this.orgId(organizationId);
    const org = await this.prisma.organization.findUnique({
      where: { id: resolvedId },
      select: { id: true, category: true, displayName: true },
    });
    if (!org) throw new NotFoundException("organization_not_found");

    const actorRole = this.resolveCategoryRole(org.category);
    const economicRole = resolveActorEconomicRole(actorRole) ?? "RETAILER";
    const hasCatalogue =
      economicRole === "PRODUCER" || economicRole === "WHOLESALER";
    const hasMarket = economicRole === "WHOLESALER" || economicRole === "RETAILER";

    return this.prisma.catalogueOwnership.upsert({
      where: { organizationId: resolvedId },
      create: {
        organizationId: resolvedId,
        actorRole: economicRole,
        hasCatalogue,
        hasMarket,
      },
      update: { actorRole: economicRole, hasCatalogue, hasMarket },
    });
  }

  async getCatalogueProducts(organizationId: string, actorRole: string) {
    const access = assertCatalogueAccess(actorRole);
    if (!access.allowed) throw new ForbiddenException(access.code);

    const orgId = this.orgId(organizationId);
    await this.ensureCatalogueOwnership(organizationId);

    const ownCatalog = await this.prisma.catalog.findFirst({
      where: {
        organizationId: orgId,
        catalogType: CatalogType.DOWNSTREAM_OWN_CATALOG,
        active: true,
      },
    });

    const products = ownCatalog
      ? await this.prisma.product.findMany({
          where: { organizationId: orgId, catalogId: ownCatalog.id, active: true },
          include: { commercialInheritance: true },
          take: 200,
        })
      : [];

    return {
      organizationId,
      lane: "catalogue" as const,
      products: products.map((p) => ({
        ...this.mapProduct(p),
        inherited: Boolean(p.commercialInheritance),
        sourceProductId: p.commercialInheritance?.sourceProductId,
      })),
    };
  }

  async getMarketFeed(organizationId: string, actorRole: string) {
    const access = assertMarketAccess(actorRole);
    if (!access.allowed) throw new ForbiddenException(access.code);

    const orgId = this.orgId(organizationId);
    await this.ensureCatalogueOwnership(organizationId);

    const projections = await this.prisma.productMarketProjection.findMany({
      where: { viewerOrganizationId: orgId, active: true },
      take: 200,
    });

    if (projections.length > 0) {
      return {
        organizationId,
        lane: "market" as const,
        products: projections.map((p) => ({
          id: p.id,
          name: p.name,
          description: p.description,
          category: p.tags[0] ?? "general",
          imageUrls: [...p.imageUrls],
          unitLabel: p.unitLabel,
          basePrice: p.basePrice ? Number(p.basePrice) : null,
          currency: p.currency,
          supplierName: p.supplierDisplayName,
          supplierOrganizationId: p.sourceOrganizationId,
          relationshipId: p.relationshipId ?? undefined,
          sourceProductId: p.sourceProductId,
          audioDescriptionUrl: p.audioDescriptionUrl,
          minOrderQuantity: p.minOrderQuantity ? Number(p.minOrderQuantity) : null,
          tags: p.tags,
        })),
      };
    }

    const org = await this.prisma.organization.findUnique({
      where: { id: orgId },
      select: { category: true },
    });
    const isWholesaler =
      org?.category === OrganizationCategory.WHOLESALER_A
      || org?.category === OrganizationCategory.WHOLESALER_B;

    if (isWholesaler) {
      const dual = await this.dualCatalog.dualCatalog(orgId);
      const products = dual.upstreamFeeds.flatMap((feed) =>
        feed.products.map((p) => ({
          id: p.id,
          name: p.name,
          description: "",
          category: p.category,
          imageUrls: [] as string[],
          unitLabel: "unité",
          basePrice: null,
          currency: "XOF",
          supplierName: feed.supplierName,
          supplierOrganizationId: feed.supplierOrganizationId,
          relationshipId: feed.relationshipId,
          sourceProductId: p.id,
        })),
      );
      return { organizationId, lane: "market" as const, products };
    }

    const rels = await this.prisma.relationship.findMany({
      where: { status: RelationshipStatus.ACCEPTED, downstreamOrganizationId: orgId },
      take: 50,
    });

    const products: ProductDto[] = [];
    for (const rel of rels) {
      if (!rel.upstreamOrganizationId) continue;
      const supplier = await this.prisma.organization.findUnique({
        where: { id: rel.upstreamOrganizationId },
        select: { displayName: true },
      });
      const upstreamProducts = await this.prisma.product.findMany({
        where: { organizationId: rel.upstreamOrganizationId, active: true },
        take: 50,
      });
      for (const p of upstreamProducts) {
        products.push({
          ...this.mapProduct(p),
          supplierName: supplier?.displayName ?? "Fournisseur",
          supplierOrganizationId: rel.upstreamOrganizationId,
          relationshipId: rel.id,
          sourceProductId: p.id,
        });
      }
    }

    return { organizationId, lane: "market" as const, products };
  }

  async getMarketProduct(organizationId: string, productId: string, actorRole: string) {
    const feed = await this.getMarketFeed(organizationId, actorRole);
    const product = feed.products.find((p) => p.id === productId || p.sourceProductId === productId);
    if (!product) throw new NotFoundException("market_product_not_found");
    return { organizationId, lane: "market" as const, product };
  }

  async getCatalogueProduct(organizationId: string, productId: string, actorRole: string) {
    const catalogue = await this.getCatalogueProducts(organizationId, actorRole);
    const product = catalogue.products.find((p) => p.id === productId);
    if (!product) throw new NotFoundException("catalogue_product_not_found");
    return { organizationId, lane: "catalogue" as const, product };
  }

  async transferMarketProductToCatalogue(
    organizationId: string,
    marketProductId: string,
    actorRole: string,
    userKey?: string,
  ) {
    const access = assertCatalogueAccess(actorRole);
    if (!access.allowed) throw new ForbiddenException(access.code);
    const marketAccess = assertMarketAccess(actorRole);
    if (!marketAccess.allowed) throw new ForbiddenException("transfer_requires_wholesaler");

    const orgId = this.orgId(organizationId);
    const market = await this.getMarketProduct(organizationId, marketProductId, actorRole);
    const sourceProductId = market.product.sourceProductId ?? market.product.id;

    let sourceProduct = await this.prisma.product.findUnique({ where: { id: sourceProductId } });
    if (!sourceProduct) {
      const projection = await this.prisma.productMarketProjection.findFirst({
        where: {
          viewerOrganizationId: orgId,
          OR: [{ id: marketProductId }, { sourceProductId }],
        },
      });
      if (!projection) throw new NotFoundException("source_product_not_found");
      sourceProduct = {
        id: projection.sourceProductId,
        organizationId: projection.sourceOrganizationId,
        catalogId: "",
        name: projection.name,
        description: projection.description,
        category: projection.tags[0] ?? "general",
        imageUrls: projection.imageUrls,
        unitLabel: projection.unitLabel,
        basePrice: projection.basePrice,
        currency: projection.currency,
        stockStatus: "AVAILABLE",
        stockQuantity: null,
        paymentModes: [],
        qualityBadges: [],
        sponsorEligible: false,
        active: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as typeof sourceProduct & object;
    }

    let ownCatalog = await this.prisma.catalog.findFirst({
      where: { organizationId: orgId, catalogType: CatalogType.DOWNSTREAM_OWN_CATALOG, active: true },
    });
    if (!ownCatalog) {
      ownCatalog = await this.prisma.catalog.create({
        data: {
          organizationId: orgId,
          name: "Mon catalogue",
          catalogType: CatalogType.DOWNSTREAM_OWN_CATALOG,
          visibilityMode: "RELATIONSHIP_ONLY",
        },
      });
    }

    const duplicatedImages = [...(sourceProduct!.imageUrls ?? [])];

    const catalogProduct = await this.prisma.product.create({
      data: {
        organizationId: orgId,
        catalogId: ownCatalog.id,
        name: sourceProduct!.name,
        description: sourceProduct!.description,
        category: sourceProduct!.category,
        imageUrls: duplicatedImages,
        unitLabel: sourceProduct!.unitLabel,
        basePrice: sourceProduct!.basePrice,
        currency: sourceProduct!.currency,
      },
    });

    await this.prisma.productCommercialInheritance.create({
      data: {
        catalogProductId: catalogProduct.id,
        sourceProductId: sourceProduct!.id,
        sourceOrganizationId: sourceProduct!.organizationId,
        inheritedFrom: market.product.relationshipId ?? market.product.supplierOrganizationId ?? "market",
        relationshipId: market.product.relationshipId ?? null,
        audioDescriptionUrl: (market.product as ProductDto).audioDescriptionUrl ?? null,
        metadata: buildTransferAnalyticsPayload("product_transferred_to_catalogue", {
          organizationId,
          sourceProductId: sourceProduct!.id,
        }) as Prisma.InputJsonValue,
      },
    });

    await this.prisma.productTransferHistory.create({
      data: {
        targetOrganizationId: orgId,
        sourceProductId: sourceProduct!.id,
        catalogProductId: catalogProduct.id,
        transferredByUserKey: userKey,
        analyticsEvent: "product_transferred_to_catalogue",
      },
    });

    return {
      ok: true,
      analytics: buildTransferAnalyticsPayload("market_conversion_to_catalogue", {
        organizationId,
        catalogProductId: catalogProduct.id,
        sourceProductId: sourceProduct!.id,
      }),
      catalogProduct: this.mapProduct(catalogProduct),
      inheritance: {
        sourceProductId: sourceProduct!.id,
        sourceOrganizationId: sourceProduct!.organizationId,
        inheritedFrom: market.product.relationshipId ?? market.product.supplierOrganizationId,
      },
    };
  }
}
