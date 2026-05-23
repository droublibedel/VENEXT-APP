import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import {
  CatalogVisibilityMode,
  Prisma,
  RelationshipStatus,
  StockStatus,
} from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";

export type RelationalCartLinePolicyContext = {
  buyerOrganizationId: string;
  sellerOrganizationId: string;
  relationshipId: string;
  negotiationId?: string | null;
  threadId?: string | null;
};

@Injectable()
export class RelationalCartPolicyService {
  constructor(private readonly prisma: PrismaService) {}

  assertActorParticipant(actorOrganizationId: string, buyerOrganizationId: string, sellerOrganizationId: string): void {
    if (actorOrganizationId !== buyerOrganizationId && actorOrganizationId !== sellerOrganizationId) {
      throw new ForbiddenException({ code: "relational_cart_participant_only" });
    }
  }

  async assertRelationshipAccepted(relationshipId: string): Promise<void> {
    const rel = await this.prisma.relationship.findUnique({
      where: { id: relationshipId },
      select: { status: true },
    });
    if (!rel) throw new NotFoundException(relationshipId);
    if (rel.status !== RelationshipStatus.ACCEPTED) {
      throw new ForbiddenException({ code: "relationship_accepted_required_for_order_conversion" });
    }
  }

  /**
   * Instruction 20.5 — product ownership + relational visibility (no public catalog, no stock reservation).
   */
  async validateLineForCart(
    productId: string,
    ctx: RelationalCartLinePolicyContext,
  ): Promise<{
    lineValidation: "VALIDATED" | "SYMBOLIC_STOCK_ONLY" | "CATALOG_VISIBILITY_REQUIRES_REVIEW";
    catalogId: string | null;
    unit: string;
    symbolicStockStatus: string;
    itemMetadata: Prisma.InputJsonValue;
  }> {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      include: { catalog: true, visibility: true },
    });
    if (!product) throw new NotFoundException(productId);
    if (product.organizationId !== ctx.sellerOrganizationId) {
      throw new ForbiddenException({ code: "relational_cart_product_not_owned_by_seller" });
    }

    const vis = product.visibility.filter((v) => v.active);
    const relVis = vis.some((v) => v.visibleToRelationshipId === ctx.relationshipId);
    const orgVis = vis.some((v) => v.visibleToOrganizationId === ctx.buyerOrganizationId);

    let inNegotiation = false;
    if (ctx.negotiationId) {
      const neg = await this.prisma.negotiation.findFirst({
        where: {
          id: ctx.negotiationId,
          productId,
          buyerOrganizationId: ctx.buyerOrganizationId,
          sellerOrganizationId: ctx.sellerOrganizationId,
        },
        select: { id: true },
      });
      inNegotiation = Boolean(neg);
    }

    const priorOrderLine = await this.prisma.orderItem.findFirst({
      where: {
        productId,
        order: {
          relationshipId: ctx.relationshipId,
          OR: [{ buyerOrganizationId: ctx.buyerOrganizationId }, { sellerOrganizationId: ctx.buyerOrganizationId }],
        },
      },
      select: { id: true },
    });
    const historicalOrder = Boolean(priorOrderLine);

    const catalogPublicLike =
      product.catalog.visibilityMode === CatalogVisibilityMode.SPONSORED_ALLOWED &&
      !ctx.threadId &&
      !ctx.negotiationId;

    const visibilityOk = relVis || orgVis || inNegotiation || historicalOrder;
    if (!visibilityOk || catalogPublicLike) {
      return {
        lineValidation: "CATALOG_VISIBILITY_REQUIRES_REVIEW",
        catalogId: product.catalogId,
        unit: product.unitLabel,
        symbolicStockStatus: String(product.stockStatus),
        itemMetadata: {
          catalogVisibilityValidated: false,
          productOwnershipValidated: true,
          symbolicStockOnly: false,
          stockNotReserved: true,
          priceNotFinalPayment: true,
          visibilitySource: catalogPublicLike ? "BLOCKED_SPONSORED_CATALOG_WITHOUT_THREAD" : "UNRESOLVED",
        } as Prisma.InputJsonValue,
      };
    }

    const symbolicOnly = product.stockStatus === StockStatus.OUT_OF_STOCK || product.stockStatus === StockStatus.HIDDEN;
    return {
      lineValidation: symbolicOnly ? "SYMBOLIC_STOCK_ONLY" : "VALIDATED",
      catalogId: product.catalogId,
      unit: product.unitLabel,
      symbolicStockStatus: String(product.stockStatus),
      itemMetadata: {
        catalogVisibilityValidated: true,
        productOwnershipValidated: true,
        symbolicStockOnly: symbolicOnly,
        stockNotReserved: true,
        priceNotFinalPayment: true,
        visibilitySource: relVis ? "RELATIONSHIP_VISIBILITY" : orgVis ? "ORG_VISIBILITY" : "NEGOTIATION_OR_ORDER_HISTORY",
      } as Prisma.InputJsonValue,
    };
  }

  /**
   * Instruction 20.6 — direct catalog path: relationship/org visibility only (no negotiation / prior-order shortcut).
   */
  async validateLineForDirectCatalog(
    productId: string,
    ctx: RelationalCartLinePolicyContext,
  ): Promise<{
    lineValidation: "VALIDATED" | "SYMBOLIC_STOCK_ONLY";
    catalogId: string | null;
    unit: string;
    symbolicStockStatus: string;
    itemMetadata: Prisma.InputJsonValue;
  }> {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      include: { catalog: true, visibility: true },
    });
    if (!product) throw new NotFoundException(productId);
    if (product.organizationId !== ctx.sellerOrganizationId) {
      throw new ForbiddenException({ code: "relational_cart_product_not_owned_by_seller" });
    }

    const vis = product.visibility.filter((v) => v.active);
    const relVis = vis.some((v) => v.visibleToRelationshipId === ctx.relationshipId);
    const orgVis = vis.some((v) => v.visibleToOrganizationId === ctx.buyerOrganizationId);

    const catalogPublicLike =
      product.catalog.visibilityMode === CatalogVisibilityMode.SPONSORED_ALLOWED && !ctx.threadId && !ctx.negotiationId;

    if (!(relVis || orgVis) || catalogPublicLike) {
      throw new ForbiddenException({ code: "catalog_product_not_visible_for_relationship" });
    }

    const symbolicOnly = product.stockStatus === StockStatus.OUT_OF_STOCK || product.stockStatus === StockStatus.HIDDEN;
    return {
      lineValidation: symbolicOnly ? "SYMBOLIC_STOCK_ONLY" : "VALIDATED",
      catalogId: product.catalogId,
      unit: product.unitLabel,
      symbolicStockStatus: String(product.stockStatus),
      itemMetadata: {
        catalogVisibilityValidated: true,
        productOwnershipValidated: true,
        symbolicStockOnly: symbolicOnly,
        stockNotReserved: true,
        priceNotFinalPayment: true,
        visibilitySource: relVis ? "RELATIONSHIP_VISIBILITY" : "ORG_VISIBILITY",
        directCatalogVisibilityStrict: true,
      } as Prisma.InputJsonValue,
    };
  }
}
