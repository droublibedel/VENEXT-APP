import { Body, Controller, Get, Param, Post } from "@nestjs/common";
import { ExternalSignalRegistryService } from "./external-signals/external-signal-registry.service";
import type { PoleInsightInputs } from "./mock-pole-insight-generator.service";
import { MockPoleInsightGenerator } from "./mock-pole-insight-generator.service";
import { PoleAiContextService } from "./pole-ai-context.service";

@Controller("v1/ai/poles")
export class PolesAiController {
  constructor(
    private readonly insightGenerator: MockPoleInsightGenerator,
    private readonly external: ExternalSignalRegistryService,
    private readonly voice: PoleAiContextService,
  ) {}

  @Get(":poleSlug/context")
  context(@Param("poleSlug") poleSlug: string) {
    return this.voice.getVoice(poleSlug);
  }

  @Get("external-connectors")
  externalConnectors() {
    return this.external.listConnectors();
  }

  /** Mock AI path: AI Gateway → Mock generator → pole adapters (Instruction 5 §5–6). */
  @Post(":poleSlug/insights")
  async poleInsights(
    @Param("poleSlug") poleSlug: string,
    @Body() body: PoleInsightInputs & { zoneCode?: string; organizationId?: string },
  ) {
    const external = await this.external.fetchAll({
      zoneCode: body.zoneCode,
      organizationId: body.organizationId,
    });
    return this.insightGenerator.generate(poleSlug, body, external);
  }
}
