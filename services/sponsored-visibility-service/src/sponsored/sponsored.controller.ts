import { Controller, Get } from "@nestjs/common";

@Controller("v1/sponsored-visibility")
export class SponsoredController {
  @Get("placement-rules")
  rules() {
    return {
      gatedBy: ["feature_flag:sponsored_products", "relationship_trust_score"],
    };
  }
}
