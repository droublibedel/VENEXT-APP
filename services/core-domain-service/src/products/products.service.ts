import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

const productSelect = {
  id: true,
  organizationId: true,
  catalogId: true,
  name: true,
  description: true,
  category: true,
  imageUrls: true,
  unitLabel: true,
  basePrice: true,
  currency: true,
  stockStatus: true,
  stockQuantity: true,
  paymentModes: true,
  qualityBadges: true,
  sponsorEligible: true,
  active: true,
  createdAt: true,
  updatedAt: true,
} as const;

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(filters?: { organizationId?: string; catalogId?: string }) {
    return this.prisma.product.findMany({
      where: {
        organizationId: filters?.organizationId,
        catalogId: filters?.catalogId,
      },
      select: productSelect,
      orderBy: { updatedAt: "desc" },
      take: 500,
    });
  }

  async findOne(id: string) {
    const row = await this.prisma.product.findUnique({
      where: { id },
      select: productSelect,
    });
    if (!row) throw new NotFoundException(id);
    return row;
  }

  /** Relationship-scoped SKU visibility — caller supplies validated relationship id */
  visibilityForRelationship(relationshipId: string) {
    return this.prisma.productVisibility.findMany({
      where: {
        active: true,
        visibleToRelationshipId: relationshipId,
      },
      include: {
        product: { select: productSelect },
      },
      take: 500,
    });
  }
}
