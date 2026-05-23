import { Injectable } from "@nestjs/common";
import { CanonicalFeatureFlagEvaluator } from "../../feature-flags/canonical-feature-flag.evaluator";
import type { CommercialNetworkBundleResponse, ExpansionMapMode } from "@venext/shared-contracts";
import { DistributorObservatoryService } from "../distributor-observatory/distributor-observatory.service";
import { NetworkInterventionsService } from "../network-interventions/network-interventions.service";
import { RelationshipStabilityService } from "../relationship-stability/relationship-stability.service";
import { RetailerRadarService } from "../retailer-radar/retailer-radar.service";
import { SponsorshipObservatoryService } from "../sponsorship-observatory/sponsorship-observatory.service";
import { CommercialNetworkBriefingService } from "./commercial-network-briefing.service";
import { CommercialNetworkContextService } from "./commercial-network-context.service";
import { CommercialExpansionMapService } from "./commercial-expansion-map.service";
import { CommercialNetworkOverviewService } from "./commercial-network-overview.service";
import { CommercialNetworkRelationshipsService } from "./commercial-network-relationships.service";

const MAP_MODES: ExpansionMapMode[] = [
  "growth",
  "weak_network",
  "sponsorship",
  "retailer_pressure",
  "distributor_density",
  "inactive_territory",
];

@Injectable()
export class CommercialNetworkBundleService {
  constructor(
    private readonly flags: CanonicalFeatureFlagEvaluator,
    private readonly ctxSvc: CommercialNetworkContextService,
    private readonly overview: CommercialNetworkOverviewService,
    private readonly relationships: CommercialNetworkRelationshipsService,
    private readonly distributors: DistributorObservatoryService,
    private readonly retailers: RetailerRadarService,
    private readonly expansionMap: CommercialExpansionMapService,
    private readonly stability: RelationshipStabilityService,
    private readonly sponsorship: SponsorshipObservatoryService,
    private readonly briefing: CommercialNetworkBriefingService,
    private readonly interventions: NetworkInterventionsService,
  ) {}

  async bundle(organizationId: string): Promise<CommercialNetworkBundleResponse> {
    const ctx = await this.ctxSvc.build(organizationId);
    const [sponsorshipOn, retailerOn, stabilityOn] = await Promise.all([
      this.flags.isEnabled("sponsorship_observatory_enabled", { organizationId }),
      this.flags.isEnabled("retailer_radar_enabled", { organizationId }),
      this.flags.isEnabled("relationship_stability_enabled", { organizationId }),
    ]);

    const overview = this.overview.fromContext(ctx);
    const relationships = this.relationships.fromContext(ctx);
    const [distributors, retailers, expansionMap, stabilityMatrix, sponsorshipObs, briefing] = await Promise.all([
      this.distributors.fromContext(ctx),
      this.retailers.fromContext(ctx, retailerOn),
      this.expansionMap.fromContext(ctx, "growth"),
      Promise.resolve(this.stability.fromContext(ctx, stabilityOn)),
      this.sponsorship.fromContext(ctx, sponsorshipOn),
      this.briefing.briefing(organizationId, ctx),
    ]);
    const interventions = this.interventions.synthesize({
      ctxGeneratedAt: ctx.generatedAt,
      organizationId,
      stability: stabilityMatrix,
      distributors,
      retailers,
    });

    return {
      version: "1",
      generatedAt: new Date().toISOString(),
      organizationId,
      overview,
      relationships,
      distributors,
      retailers,
      expansionMap,
      stabilityMatrix,
      sponsorship: sponsorshipObs,
      briefing,
      interventions,
    };
  }

  parseMapMode(raw?: string): ExpansionMapMode {
    const m = (raw ?? "growth") as ExpansionMapMode;
    return MAP_MODES.includes(m) ? m : "growth";
  }
}
