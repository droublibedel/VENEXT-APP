import { Module } from "@nestjs/common";
import { GraphCoreModule } from "../graph-core.module";
import { RelationshipModule } from "../relationship/relationship.module";
import { NetworkCodeGraphController } from "./network-code.controller";
import { NetworkCodeService } from "./network-code.service";

@Module({
  imports: [GraphCoreModule, RelationshipModule],
  controllers: [NetworkCodeGraphController],
  providers: [NetworkCodeService],
})
export class NetworkCodeGraphModule {}
