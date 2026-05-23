import { Module } from "@nestjs/common";
import { SponsoredController } from "./sponsored.controller";

@Module({
  controllers: [SponsoredController],
})
export class SponsoredModule {}
