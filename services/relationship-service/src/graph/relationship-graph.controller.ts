import { Controller, Get } from "@nestjs/common";
import { RelationshipGraphService } from "./relationship-graph.service";

@Controller("v1/relationship-graph")
export class RelationshipGraphController {
  constructor(private readonly graph: RelationshipGraphService) {}

  @Get("principles")
  principles() {
    return this.graph.visibilityPrinciple();
  }
}
