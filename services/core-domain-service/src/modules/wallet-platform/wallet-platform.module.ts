import { Module } from "@nestjs/common";

import { WalletInfrastructureModule } from "../wallet-infrastructure/wallet-infrastructure.module";
import { WalletPlatformController } from "./wallet-platform.controller";
import { WalletPlatformService } from "./wallet-platform.service";

@Module({
  imports: [WalletInfrastructureModule],
  controllers: [WalletPlatformController],
  providers: [WalletPlatformService],
  exports: [WalletPlatformService],
})
export class WalletPlatformModule {}
