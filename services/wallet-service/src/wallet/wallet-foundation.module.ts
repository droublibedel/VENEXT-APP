import { Module } from "@nestjs/common";
import { WalletFoundationController } from "./wallet-foundation.controller";

@Module({
  controllers: [WalletFoundationController],
})
export class WalletFoundationModule {}
