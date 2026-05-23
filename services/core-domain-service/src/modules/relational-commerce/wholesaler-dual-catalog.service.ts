import { Injectable, NotFoundException } from "@nestjs/common";
import { CatalogType, OrganizationCategory, RelationshipStatus } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";
import { ProductIntelligenceService } from "../product-intelligence/product-intelligence.service";

type CatalogProduct = { id: string; name: string; category: string };

/**
 * Instruction 9A — explicit upstream vs own-downstream lanes (never silently merged).
 */
@Injectable()
export class WholesalerDualCatalogService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly intelligence: ProductIntelligenceService,
  ) {}

  async dualCatalog(organizationId: string) {
    const org = await this.prisma.organization.findUnique({
      where: { id: organizationId },
      select: { id: true, displayName: true, category: true },
    });
    if (!org) throw new NotFoundException(organizationId);

    const isWholesaler =
      org.category === OrganizationCategory.WHOLESALER_A ||
      org.category === OrganizationCategory.WHOLESALER_B;

    if (!isWholesaler) {
      return {
        organizationId,
        upstreamFeeds: [] as {
          supplierOrganizationId: string;
          supplierName: string;
          relationshipId: string;
          products: CatalogProduct[];
        }[],
        downstreamOwnCatalog: { catalogId: null as string | null, products: [] as CatalogProduct[] },
        notice: "dual_catalog_only_for_wholesaler_categories",
      };
    }

    const upstreamRels = await this.prisma.relationship.findMany({
      where: {
        status: RelationshipStatus.ACCEPTED,
        downstreamOrganizationId: organizationId,
      },
      orderBy: { acceptedAt: "desc" },
      take: 50,
    });

    const upstreamFeeds = [];
    for (const rel of upstreamRels) {
      if (!rel.upstreamOrganizationId) continue;
      const feed = await this.intelligence.livingCatalog(rel.id, organizationId);
      const supplier = await this.prisma.organization.findUnique({
        where: { id: rel.upstreamOrganizationId },
        select: { displayName: true },
      });
      type CardWithProduct = { product: { id: string; name: string; category: string } };
      const products: CatalogProduct[] = (feed.cards as CardWithProduct[]).map((c) => ({
        id: c.product.id,
        name: c.product.name,
        category: c.product.category,
      }));
      upstreamFeeds.push({
        supplierOrganizationId: rel.upstreamOrganizationId,
        supplierName: supplier?.displayName ?? rel.upstreamOrganizationId,
        relationshipId: rel.id,
        products,
      });
    }

    const ownCatalog = await this.prisma.catalog.findFirst({
      where: {
        organizationId,
        catalogType: CatalogType.DOWNSTREAM_OWN_CATALOG,
        active: true,
      },
      orderBy: { createdAt: "asc" },
    });

    let downstreamProducts: CatalogProduct[] = [];
    let catalogId: string | null = null;
    if (ownCatalog) {
      catalogId = ownCatalog.id;
      const prods = await this.prisma.product.findMany({
        where: { organizationId, catalogId: ownCatalog.id, active: true },
        select: { id: true, name: true, category: true },
        take: 200,
      });
      downstreamProducts = prods;
    }

    return {
      organizationId,
      upstreamFeeds,
      downstreamOwnCatalog: { catalogId, products: downstreamProducts },
    };
  }
}
