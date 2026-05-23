import { Controller, Get, Param, ParseUUIDPipe } from "@nestjs/common";
import { ProductTraceabilityService } from "./product-traceability.service";

@Controller("product-traceability")
export class ProductTraceabilityController {
  constructor(private readonly trace: ProductTraceabilityService) {}

  @Get("products/:productId")
  getTrace(@Param("productId", ParseUUIDPipe) productId: string) {
    return this.trace.getTraceability(productId);
  }

  @Get("products/:productId/recalls")
  listRecalls(@Param("productId", ParseUUIDPipe) productId: string) {
    return this.trace.listRecalls(productId);
  }
}
