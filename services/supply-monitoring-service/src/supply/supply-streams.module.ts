import { Module } from "@nestjs/common";
import { SupplyStreamsController } from "./supply-streams.controller";

@Module({
  controllers: [SupplyStreamsController],
})
export class SupplyStreamsModule {}
