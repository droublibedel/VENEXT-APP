import { Injectable } from "@nestjs/common";
import type { OrderAdvBriefingResponse, OrdersOverviewResponse } from "@venext/shared-contracts";
import { CanonicalFeatureFlagEvaluator } from "../../feature-flags/canonical-feature-flag.evaluator";
import { BackofficeAiGatewayService } from "../backoffice/backoffice-ai-gateway.service";

@Injectable()
export class OrderAdvBriefingService {
  constructor(
    private readonly flags: CanonicalFeatureFlagEvaluator,
    private readonly gateway: BackofficeAiGatewayService,
  ) {}

  async briefing(
    organizationId: string,
    pack: {
      overview: OrdersOverviewResponse;
      negotiationsOpen: number;
      blockedDeliveries: number;
    },
  ): Promise<OrderAdvBriefingResponse> {
    const aiOn = await this.flags.isEnabled("order_adv_ai_enabled", { organizationId });
    if (!aiOn) {
      return {
        provider: "MockAIProvider",
        policy: "DISABLED",
        executiveSummary: "order_adv_ai_enabled gates the execution strategist narrative (Instruction 14).",
        dataSources: ["feature_flag:order_adv_ai_enabled"],
        note: "Non-chatbot policy surface — enable order_adv_ai_enabled for structured mock output.",
      };
    }

    return this.gateway.generateOrderAdvBriefing({
      activeOrders: pack.overview.activeOrders,
      delayedOrders: pack.overview.delayedOrders,
      negotiationIntensity: pack.overview.negotiationIntensity,
      deliveryTension: pack.overview.deliveryTension,
      groupedBuyingActivity: pack.overview.groupedBuyingActivity,
      reservationPressure: pack.overview.reservationPressure,
      transactionConfidence: pack.overview.transactionConfidence,
      conversationalCommerceIntensity: pack.overview.conversationalCommerceIntensity,
      negotiationsOpen: pack.negotiationsOpen,
      blockedDeliveries: pack.blockedDeliveries,
      dataSources: [
        "orders_overview",
        "negotiation_intelligence",
        "delivery_priority",
        "group_buying_supervision",
        "reservation_allocation",
      ],
    });
  }
}
