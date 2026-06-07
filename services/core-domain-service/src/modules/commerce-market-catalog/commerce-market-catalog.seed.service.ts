import { Injectable, Logger } from "@nestjs/common";
import { OrganizationCategory } from "@prisma/client";

import { PrismaService } from "../../prisma/prisma.service";
import {
  DEMO_ORGANIZATION_SLUG_TO_UUID,
  resolveCommerceOrganizationId,
} from "./resolve-demo-organization";

@Injectable()
export class CommerceMarketCatalogSeedService {
  private readonly log = new Logger(CommerceMarketCatalogSeedService.name);

  constructor(private readonly prisma: PrismaService) {}

  async seedArchi05DemoIfEmpty(): Promise<void> {
    const existing = await this.prisma.catalogueOwnership.count();
    if (existing >= 3) {
      this.log.log("ARCHI-05 seed skip — ownership rows exist");
      return;
    }

    const producer = await this.prisma.organization.findFirst({
      where: { category: OrganizationCategory.PRODUCER },
      select: { id: true },
    });
    const wholesaler = await this.prisma.organization.findFirst({
      where: { category: OrganizationCategory.WHOLESALER_B },
      select: { id: true },
    });
    const retailer = await this.prisma.organization.findFirst({
      where: { category: OrganizationCategory.RETAILER },
      select: { id: true },
    });

    if (!producer || !wholesaler || !retailer) {
      this.log.warn("ARCHI-05 seed skip — organizations missing");
      return;
    }

    const demoOrgs = [
      { id: producer.id, role: "PRODUCER", hasCatalogue: true, hasMarket: false },
      { id: wholesaler.id, role: "WHOLESALER", hasCatalogue: true, hasMarket: true },
      { id: retailer.id, role: "RETAILER", hasCatalogue: false, hasMarket: true },
    ];

    for (const org of demoOrgs) {
      await this.prisma.catalogueOwnership.upsert({
        where: { organizationId: org.id },
        create: {
          organizationId: org.id,
          actorRole: org.role,
          hasCatalogue: org.hasCatalogue,
          hasMarket: org.hasMarket,
        },
        update: { actorRole: org.role, hasCatalogue: org.hasCatalogue, hasMarket: org.hasMarket },
      });
    }

    const producerProducts = await this.prisma.product.findMany({
      where: { organizationId: producer.id },
      take: 5,
    });

    const grossisteUuid = resolveCommerceOrganizationId("org-grossiste-b-demo");
    const detaillantUuid = resolveCommerceOrganizationId("org-detaillant-yopougon");

    for (const p of producerProducts) {
      for (const [viewerId, label] of [
        [grossisteUuid, "Producteur partenaire"],
        [detaillantUuid, "Grossiste"],
      ] as const) {
        const exists = await this.prisma.productMarketProjection.findFirst({
          where: { viewerOrganizationId: viewerId, sourceProductId: p.id },
        });
        if (exists) continue;
        await this.prisma.productMarketProjection.create({
          data: {
            viewerOrganizationId: viewerId,
            sourceProductId: p.id,
            sourceOrganizationId: producer.id,
            supplierDisplayName: label,
            name: p.name,
            description: p.description,
            imageUrls: p.imageUrls,
            unitLabel: p.unitLabel,
            basePrice: p.basePrice,
            currency: p.currency,
            tags: [p.category],
          },
        });
      }
    }

    this.log.log(`ARCHI-05 seed applied (${Object.keys(DEMO_ORGANIZATION_SLUG_TO_UUID).length} demo slugs mapped)`);
  }
}
