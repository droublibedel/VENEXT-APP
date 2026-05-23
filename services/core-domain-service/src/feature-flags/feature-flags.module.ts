import { Module } from "@nestjs/common";
import { CanonicalFeatureFlagEvaluator } from "./canonical-feature-flag.evaluator";
import { FeatureFlagsController } from "./feature-flags.controller";
import { FeatureFlagsService } from "./feature-flags.service";

@Module({
  controllers: [FeatureFlagsController],
  providers: [FeatureFlagsService, CanonicalFeatureFlagEvaluator],
  exports: [FeatureFlagsService, CanonicalFeatureFlagEvaluator],
})
export class FeatureFlagsModule {}
