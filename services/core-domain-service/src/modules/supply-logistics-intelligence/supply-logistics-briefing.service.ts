import { Injectable } from "@nestjs/common";
import type { SupplyLogisticsBriefingResponse, SupplyOverviewResponse } from "@venext/shared-contracts";
import { CanonicalFeatureFlagEvaluator } from "../../feature-flags/canonical-feature-flag.evaluator";
import { BackofficeAiGatewayService } from "../backoffice/backoffice-ai-gateway.service";

@Injectable()
export class SupplyLogisticsBriefingService {
  constructor(
    private readonly flags: CanonicalFeatureFlagEvaluator,
    private readonly gateway: BackofficeAiGatewayService,
  ) {}

  async briefing(
    organizationId: string,
    overview: SupplyOverviewResponse,
    pack: {
      delayedShipments: number;
      routeCongestionIndex: number;
      unstableTerritories: number;
    },
  ): Promise<SupplyLogisticsBriefingResponse> {
    const aiOn = await this.flags.isEnabled("supply_ai_enabled", { organizationId });
    if (!aiOn) {
      return {
        provider: "MockAIProvider",
        policy: "DISABLED",
        executiveSummary: "supply_ai_enabled gates the logistics command briefing (Instruction 15).",
        dataSources: ["feature_flag:supply_ai_enabled"],
        note: "Non-chatbot policy surface — enable supply_ai_enabled for structured mock output.",
      };
    }

    return this.gateway.generateSupplyLogisticsBriefing({
      activeShipments: overview.activeShipments,
      delayedShipments: pack.delayedShipments,
      routeCongestionIndex: pack.routeCongestionIndex,
      warehousePressureIndex: overview.warehousePressureIndex,
      loadingDelayIndex: overview.loadingDelayIndex,
      fulfillmentConfidence: overview.fulfillmentConfidence,
      territoryInstability: overview.territoryInstability,
      unstableTerritories: pack.unstableTerritories,
      dataSources: [
        "supply_overview",
        "territory_flow",
        "shipment_health",
        "delivery_route_intelligence",
        "warehouse_pressure",
      ],
    });
  }
}
