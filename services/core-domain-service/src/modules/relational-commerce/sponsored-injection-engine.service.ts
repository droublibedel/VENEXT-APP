import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { ProductRelevanceResolverService } from "../product-intelligence/product-relevance-resolver.service";
import { RelationalCommerceNetworkTraverserService } from "./relational-commerce-network-traverser.service";
import { RelationalFlagsService } from "./relational-flags.service";

function norm(s: string | null | undefined) {
  return (s ?? "").trim().toLowerCase();
}

function categoryCompatible(target: string, viewerHint: string | undefined) {
  const t = norm(target);
  const v = norm(viewerHint);
  if (!t || !v) return true;
  return t.includes(v) || v.includes(t) || t.slice(0, 6) === v.slice(0, 6);
}

/** Country mismatch always denies when both known; city mismatch denies only when both known. */
function geoMatch(sponsorCity: string | null, sponsorCountry: string | null, viewerCity: string | null, viewerCountry: string | null) {
  if (norm(viewerCountry) && norm(sponsorCountry) && norm(viewerCountry) !== norm(sponsorCountry)) {
    return false;
  }
  if (norm(viewerCity) && norm(sponsorCity) && norm(viewerCity) !== norm(sponsorCity)) {
    return false;
  }
  return true;
}

export type SponsoredInjectionProjection = "summary" | "standard" | "full";

export type SponsoredInjectionListInput = {
  viewerCategory?: string;
  viewerOrganizationId?: string;
  limit?: number;
  /** Previous page last `injectionId` (createdAt-desc stable ordering). */
  cursor?: string;
  projection?: SponsoredInjectionProjection;
};

export type SponsoredInjectionListItem = {
  injectionId: string;
  disclosure: "SPONSORED_DISCOVERY";
  sponsor: {
    id: string;
    displayName: string;
    commercialId: string | null;
    category: string | null;
    city: string | null;
    country: string | null;
  };
  product: {
    id: string;
    name: string;
    category: string;
    imageUrls: unknown;
    basePrice: unknown;
    currency: string;
    organizationId: string;
  };
  relevanceFloor: number;
  maxRelationshipDepth: number;
};

function projectSponsoredItem(
  item: SponsoredInjectionListItem,
  projection: SponsoredInjectionProjection,
): SponsoredInjectionListItem {
  if (projection === "full" || projection === "standard") return item;
  return {
    ...item,
    product: {
      id: item.product.id,
      name: item.product.name,
      category: item.product.category,
      currency: item.product.currency,
      organizationId: item.product.organizationId,
    },
    sponsor: {
      id: item.sponsor.id,
      displayName: item.sponsor.displayName,
      commercialId: item.sponsor.commercialId,
    },
  } as SponsoredInjectionListItem;
}

/**
 * Sponsored lane only — explicit labeling, no stealth substitution (Instruction 9 §10–11, 9A).
 */
@Injectable()
export class SponsoredInjectionEngineService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly flags: RelationalFlagsService,
    private readonly networkTraverser: RelationalCommerceNetworkTraverserService,
    private readonly relevance: ProductRelevanceResolverService,
  ) {}

  async listActiveInjections(input: SponsoredInjectionListInput = {}) {
    const { viewerCategory, viewerOrganizationId } = input;
    const projection: SponsoredInjectionProjection = input.projection ?? "standard";
    const pageLimit = Math.min(Math.max(input.limit ?? 40, 1), 80);

    const sponsoredOn = await this.flags.isEnabled("sponsored_products_enabled", viewerOrganizationId);
    if (!sponsoredOn) {
      return {
        items: [] as SponsoredInjectionListItem[],
        page: {
          limit: pageLimit,
          nextCursor: null as string | null,
          hasMore: false,
          projection,
        },
      };
    }

    const viewerOrg = viewerOrganizationId
      ? await this.prisma.organization.findUnique({
          where: { id: viewerOrganizationId },
          select: { category: true, activityLabel: true, city: true, country: true, commune: true },
        })
      : null;

    const viewerCatHint = viewerCategory ?? viewerOrg?.activityLabel ?? viewerOrg?.category ?? undefined;

    const rows = await this.prisma.sponsoredProductInjection.findMany({
      where: {
        active: true,
        OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
      },
      take: 60,
      include: {
        product: {
          select: {
            id: true,
            name: true,
            category: true,
            imageUrls: true,
            basePrice: true,
            currency: true,
            organizationId: true,
          },
        },
        sponsor: {
          select: {
            id: true,
            displayName: true,
            commercialId: true,
            category: true,
            city: true,
            country: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const out: SponsoredInjectionListItem[] = [];

    for (const r of rows) {
      if (!categoryCompatible(r.targetCommercialCategory, viewerCatHint)) {
        continue;
      }

      if (
        !geoMatch(
          r.sponsor.city,
          r.sponsor.country,
          viewerOrg?.city ?? null,
          viewerOrg?.country ?? null,
        )
      ) {
        continue;
      }

      if (viewerOrganizationId) {
        const hops = await this.networkTraverser.shortestPathHops(
          viewerOrganizationId,
          r.sponsorOrganizationId,
          Math.max(1, r.maxRelationshipDepth),
        );
        if (hops === null || hops > r.maxRelationshipDepth) {
          continue;
        }

        const zoneCode =
          viewerOrg?.commune && viewerOrg?.country
            ? `${viewerOrg.country}-${String(viewerOrg.commune).slice(0, 6)}`
            : viewerOrg?.city
              ? `${viewerOrg.country ?? "SN"}-${viewerOrg.city}`
              : undefined;
        const rel = await this.relevance.resolve({
          productId: r.productId,
          retailerOrganizationId: viewerOrganizationId,
          relationshipId: r.relationshipId ?? undefined,
          zoneCode,
        });
        if (rel.relevanceScore < r.relevanceFloor) {
          continue;
        }
      }

      out.push({
        injectionId: r.id,
        disclosure: "SPONSORED_DISCOVERY",
        sponsor: r.sponsor,
        product: r.product,
        relevanceFloor: r.relevanceFloor,
        maxRelationshipDepth: r.maxRelationshipDepth,
      });
    }

    let start = 0;
    if (input.cursor?.trim()) {
      const idx = out.findIndex((x) => x.injectionId === input.cursor!.trim());
      start = idx >= 0 ? idx + 1 : 0;
    }
    const window = out.slice(start, start + pageLimit + 1);
    const hasMore = window.length > pageLimit;
    const rawItems = hasMore ? window.slice(0, pageLimit) : window;
    const items = rawItems.map((x) => projectSponsoredItem(x, projection));
    const nextCursor = hasMore && items.length > 0 ? items[items.length - 1]!.injectionId : null;

    return {
      items,
      page: { limit: pageLimit, nextCursor, hasMore, projection },
    };
  }
}
