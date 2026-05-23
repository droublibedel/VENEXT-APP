import { Controller, ForbiddenException, Get, Param, ParseUUIDPipe, Query } from "@nestjs/common";
import { CanonicalFeatureFlagEvaluator } from "../feature-flags/canonical-feature-flag.evaluator";
import { IndustrialPolesService } from "./industrial-poles.service";

@Controller("industrial-poles")
export class IndustrialPolesController {
  constructor(
    private readonly poles: IndustrialPolesService,
    private readonly flags: CanonicalFeatureFlagEvaluator,
  ) {}

  @Get()
  async list(@Query("organizationId") organizationId?: string) {
    if (!(await this.flags.isEnabled("industrial_poles_enabled", { organizationId }))) {
      throw new ForbiddenException("industrial_poles_disabled");
    }
    return this.poles.findAll(organizationId);
  }

  @Get(":id")
  async get(@Param("id", ParseUUIDPipe) id: string) {
    if (!(await this.flags.isEnabled("industrial_poles_enabled", {}))) {
      throw new ForbiddenException("industrial_poles_disabled");
    }
    return this.poles.findOne(id);
  }
}
