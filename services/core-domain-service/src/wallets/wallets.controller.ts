import { Controller, Get, Param, ParseUUIDPipe, Query } from "@nestjs/common";
import { WalletsService } from "./wallets.service";

@Controller("wallets")
export class WalletsController {
  constructor(private readonly wallets: WalletsService) {}

  @Get()
  list(@Query("organizationId") organizationId?: string) {
    return this.wallets.findAll(organizationId);
  }

  @Get(":id/transactions")
  txs(@Param("id", ParseUUIDPipe) id: string) {
    return this.wallets.transactionsForWallet(id);
  }

  @Get(":id")
  get(@Param("id", ParseUUIDPipe) id: string) {
    return this.wallets.findOne(id);
  }
}
