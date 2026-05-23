import { Controller, Get } from "@nestjs/common";

@Controller("v1/relational-catalog")
export class RelationalCatalogController {
  @Get("visibility-model")
  model() {
    return {
      exposure: "relationship_scoped",
      tables: ["catalogs", "products", "product_visibility"],
    };
  }
}
