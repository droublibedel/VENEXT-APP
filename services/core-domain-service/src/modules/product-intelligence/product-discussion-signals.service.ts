import { Injectable } from "@nestjs/common";
import { NegotiationStatus, ThreadType } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";

export type ProductDiscussionSignalsDto = {
  productId: string;
  activeNegotiations: number;
  productAnchoredThreads: number;
  recentOrderLineItems: number;
  /** Operational copy — no personal identities */
  narrativeLines: string[];
};

/**
 * Aggregates commerce-first discussion / negotiation density (Instruction 6 §5).
 */
@Injectable()
export class ProductDiscussionSignalsService {
  constructor(private readonly prisma: PrismaService) {}

  async getSignals(productId: string): Promise<ProductDiscussionSignalsDto> {
    const since = new Date(Date.now() - 30 * 86_400_000);
    const [activeNegotiations, productAnchoredThreads, recentOrderLineItems] =
      await Promise.all([
        this.prisma.negotiation.count({
          where: {
            productId,
            status: { in: [NegotiationStatus.OPEN, NegotiationStatus.PROPOSED] },
          },
        }),
        this.prisma.messageThread.count({
          where: {
            productId,
            threadType: ThreadType.PRODUCT_CONTEXT,
          },
        }),
        this.prisma.orderItem.count({
          where: {
            productId,
            order: { createdAt: { gte: since } },
          },
        }),
      ]);

    const narrativeLines: string[] = [];
    if (activeNegotiations > 0) {
      narrativeLines.push(
        `${activeNegotiations} négociation(s) commerciale(s) active(s) sur ce SKU`,
      );
    }
    if (productAnchoredThreads > 0) {
      narrativeLines.push(
        `${productAnchoredThreads} fil(s) discussion ancré(s) produit — contexte commerce`,
      );
    }
    if (recentOrderLineItems > 0) {
      narrativeLines.push(
        `Mouvement commercial récent: ${recentOrderLineItems} ligne(s) commande (30j)`,
      );
    }
    if (narrativeLines.length === 0) {
      narrativeLines.push("Veille commerciale: densité d’échanges encore basse sur ce réseau.");
    }

    return {
      productId,
      activeNegotiations,
      productAnchoredThreads,
      recentOrderLineItems,
      narrativeLines,
    };
  }
}
