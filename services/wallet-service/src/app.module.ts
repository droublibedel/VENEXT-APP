import { Module } from "@nestjs/common";
import { HealthController } from "./health.controller";
import { WalletFoundationModule } from "./wallet/wallet-foundation.module";

@Module({
  imports: [WalletFoundationModule],
  controllers: [HealthController],
})
export class AppModule {}
