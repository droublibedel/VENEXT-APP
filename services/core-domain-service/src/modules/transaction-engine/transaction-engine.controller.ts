import { Body, Controller, Get, Param, ParseUUIDPipe, Post } from "@nestjs/common";
import { TransactionType } from "@prisma/client";
import { FinancialFeaturesService } from "../financial-feature-flags/financial-features.service";
import { TransactionOrchestratorService } from "./transaction-orchestrator.service";

@Controller("transaction-engine")
export class TransactionEngineController {
  constructor(
    private readonly orchestrator: TransactionOrchestratorService,
    private readonly flags: FinancialFeaturesService,
  ) {}

  @Post("initiate")
  async initiate(
    @Body()
    body: {
      walletId: string;
      organizationId: string;
      type: TransactionType;
      amount: number;
      currency: string;
      direction: "INBOUND" | "OUTBOUND";
      counterpartyWalletId?: string | null;
      idempotencyKey?: string | null;
      regionCode?: string;
      simulateFail?: boolean;
      delayMs?: number;
    },
  ) {
    await this.flags.requireEnabled("wallet_enabled", body.organizationId, body.regionCode);
    if (body.type === TransactionType.TRANSFER) {
      await this.flags.requireEnabled("transfer_enabled", body.organizationId, body.regionCode);
    } else {
      await this.flags.requireEnabled("payments_enabled", body.organizationId, body.regionCode);
    }
    return this.orchestrator.initiate({
      walletId: body.walletId,
      organizationId: body.organizationId,
      type: body.type,
      amount: body.amount,
      currency: body.currency,
      direction: body.direction,
      counterpartyWalletId: body.counterpartyWalletId,
      idempotencyKey: body.idempotencyKey,
      regionCode: body.regionCode,
      providerOptions: { simulateFail: body.simulateFail, delayMs: body.delayMs },
    });
  }

  @Post("validate-signature")
  validate(
    @Body()
    body: {
      walletId: string;
      organizationId: string;
      type: TransactionType;
      amount: number;
      currency: string;
      nonce: string;
      direction: string;
      counterpartyWalletId?: string | null;
      payloadSignature: string;
    },
  ) {
    return this.orchestrator.validateSignature(body);
  }

  @Get("recent-events")
  recent() {
    return this.orchestrator.recentFinancialEvents();
  }

  @Get("transactions/:id")
  one(@Param("id", ParseUUIDPipe) id: string) {
    return this.orchestrator.findTransaction(id);
  }
}
