import { Module } from "@nestjs/common";
import { NetworkInterventionsService } from "./network-interventions.service";

@Module({
  providers: [NetworkInterventionsService],
  exports: [NetworkInterventionsService],
})
export class NetworkInterventionsModule {}
