import { Controller, Get, Param, ParseUUIDPipe, Query } from "@nestjs/common";
import { FeatureFlagScopeType } from "@prisma/client";
import { CanonicalFeatureFlagEvaluator } from "./canonical-feature-flag.evaluator";
import { FeatureFlagsService } from "./feature-flags.service";

@Controller("feature-flags")
export class FeatureFlagsController {
  constructor(
    private readonly flags: FeatureFlagsService,
    private readonly canonicalEvaluator: CanonicalFeatureFlagEvaluator,
  ) {}

  /** Instruction 9B — canonical evaluation (for clients / ops). */
  @Get("canonical/:key")
  evaluateCanonical(
    @Param("key") key: string,
    @Query("organizationId") organizationId?: string,
    @Query("region") region?: string,
    @Query("country") country?: string,
  ) {
    return this.canonicalEvaluator.evaluate(key, { organizationId, region, country });
  }

  @Get()
  list(
    @Query("scopeType") scopeType?: FeatureFlagScopeType,
    @Query("scopeValue") scopeValue?: string,
    @Query("key") key?: string,
  ) {
    return this.flags.findRuntime({
      scopeType,
      scopeValue,
      key,
    });
  }

  @Get(":id")
  get(@Param("id", ParseUUIDPipe) id: string) {
    return this.flags.findOne(id);
  }
}
