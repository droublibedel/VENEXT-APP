import { Module } from "@nestjs/common";
import { FeatureFlagsModule } from "../../feature-flags/feature-flags.module";
import { PlatformAuthzModule } from "../../platform-authz/platform-authz.module";
import { PrismaModule } from "../../prisma/prisma.module";
import { CommercialBridgeService } from "./commercial-bridge.service";
import { CommercialCoverageService } from "./commercial-coverage.service";
import { CommercialDependencyClusterService } from "./commercial-dependency-cluster.service";
import { CommercialRelationshipChainService } from "./commercial-relationship-chain.service";
import { CommercialRelationshipEdgeService } from "./commercial-relationship-edge.service";
import { CommercialRelationshipGraphController } from "./commercial-relationship-graph.controller";
import { CommercialRelationshipGraphEngineService } from "./commercial-relationship-graph-engine.service";
import { CommercialRelationshipNodeService } from "./commercial-relationship-node.service";
import { CommercialRelationshipGraphRealtimePublishService } from "./commercial-relationship-realtime-publish.service";

@Module({
  imports: [PrismaModule, FeatureFlagsModule, PlatformAuthzModule],
  controllers: [CommercialRelationshipGraphController],
  providers: [
    CommercialRelationshipNodeService,
    CommercialRelationshipEdgeService,
    CommercialDependencyClusterService,
    CommercialCoverageService,
    CommercialBridgeService,
    CommercialRelationshipChainService,
    CommercialRelationshipGraphRealtimePublishService,
    CommercialRelationshipGraphEngineService,
  ],
  exports: [CommercialRelationshipGraphEngineService],
})
export class CommercialRelationshipGraphModule {}
