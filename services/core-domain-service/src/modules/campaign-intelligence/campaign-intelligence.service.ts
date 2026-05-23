import { Injectable } from "@nestjs/common";
import { OrderStatus } from "@prisma/client";
import type { CampaignIntelligenceResponse } from "@venext/shared-contracts";
import { PrismaService } from "../../prisma/prisma.service";
import type { CommercialNetworkContext } from "../commercial-network-intelligence/commercial-network-context.service";
import type { SponsoredInjectionListSnapshot } from "../sponsorship-pressure/sponsorship-pressure.service";
import { ActivationCampaignProvider } from "./activation-campaign.provider";

@Injectable()
export class CampaignIntelligenceService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly campaigns: ActivationCampaignProvider,
  ) {}

  async fromContext(
    ctx: CommercialNetworkContext,
    snapshot: SponsoredInjectionListSnapshot | null,
  ): Promise<CampaignIntelligenceResponse> {
    const orgId = ctx.organizationId;
    const t14 = new Date(Date.now() - 14 * 86400000);
    const orders = await this.prisma.order.findMany({
      where: {
        sellerOrganizationId: orgId,
        status: { notIn: [OrderStatus.CANCELLED] },
        createdAt: { gte: t14 },
      },
      select: { id: true, createdAt: true, buyerOrganizationId: true },
      take: 800,
      orderBy: { createdAt: "desc" },
    });

    const waveA = orders.filter((o) => o.createdAt.getTime() > Date.now() - 4 * 86400000).length;
    const waveB = orders.length - waveA;

    const rows = this.campaigns.listCampaigns(ctx, snapshot, waveA, waveB);

    return {
      generatedAt: ctx.generatedAt,
      organizationId: orgId,
      layer: "ACTIVATION_CAMPAIGN_ABSTRACTION_V1",
      moduleNote:
        "No dedicated campaign persistence model — rows composed by ActivationCampaignProvider from orders + sponsored snapshot (Instruction 13A).",
      campaigns: rows,
      abstractionProvider: "ActivationCampaignProvider_V1",
    };
  }
}
