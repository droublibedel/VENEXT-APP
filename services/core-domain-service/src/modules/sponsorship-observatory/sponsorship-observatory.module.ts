import { Module } from "@nestjs/common";
import { RelationalCommerceModule } from "../relational-commerce/relational-commerce.module";
import { SponsorshipObservatoryService } from "./sponsorship-observatory.service";

@Module({
  imports: [RelationalCommerceModule],
  providers: [SponsorshipObservatoryService],
  exports: [SponsorshipObservatoryService],
})
export class SponsorshipObservatoryModule {}
