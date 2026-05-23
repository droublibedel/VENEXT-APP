import { Global, Module } from "@nestjs/common";
import { PrismaModule } from "../prisma/prisma.module";
import { GraphSignalsService } from "./graph-signals.service";

@Global()
@Module({
  imports: [PrismaModule],
  providers: [GraphSignalsService],
  exports: [GraphSignalsService],
})
export class GraphCoreModule {}
