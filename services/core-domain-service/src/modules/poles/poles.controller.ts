import { Controller, Get, NotFoundException, Param } from "@nestjs/common";
import { OrgMemberPole } from "@prisma/client";
import { DemoOperationalDataService } from "./demo-operational-data.service";
import { PolesRegistryService } from "./poles-registry.service";

@Controller("poles")
export class PolesController {
  constructor(
    private readonly registry: PolesRegistryService,
    private readonly demo: DemoOperationalDataService,
  ) {}

  @Get("registry")
  listRegistry() {
    return this.registry.list();
  }

  @Get("demo-operational")
  demoOperationalAll() {
    return this.registry.list().map((entry) => ({
      pole: entry.pole,
      routeSlug: entry.routeSlug,
      summary: entry.displayName,
      bbox: this.demo.bundleForPole(entry.pole).bbox,
    }));
  }

  /** Demo operational bundle for map + signal stream (Instruction 5 §14). `:pole` = route slug, e.g. `supply-logistics`. */
  @Get("demo-operational/:pole")
  demoOperational(@Param("pole") poleSlug: string) {
    const entry = this.registry.bySlug(poleSlug);
    if (!entry) throw new NotFoundException(poleSlug);
    return this.demo.bundleForPole(entry.pole);
  }
}
