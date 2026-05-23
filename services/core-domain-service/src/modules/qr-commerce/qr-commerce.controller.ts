import { Body, Controller, Post } from "@nestjs/common";
import { FinancialFeaturesService } from "../financial-feature-flags/financial-features.service";
import { TransactionOrchestratorService } from "../transaction-engine/transaction-orchestrator.service";
import { QrCommerceEngineService, type QrKind } from "./qr-commerce-engine.service";

@Controller("qr-commerce")
export class QrCommerceController {
  constructor(
    private readonly qr: QrCommerceEngineService,
    private readonly flags: FinancialFeaturesService,
    private readonly orchestrator: TransactionOrchestratorService,
  ) {}

  @Post("generate")
  async generate(
    @Body()
    body: {
      organizationId: string;
      kind: QrKind;
      currency: string;
      productId?: string | null;
      orderId?: string | null;
      amountMinor?: number | null;
      rail?: "wallet" | "external" | "hybrid";
      regionCode?: string;
    },
  ) {
    await this.flags.requireEnabled("qr_enabled", body.organizationId, body.regionCode);
    await this.flags.requireEnabled("wallet_enabled", body.organizationId, body.regionCode);
    const payload = this.qr.buildPayload({
      kind: body.kind,
      organizationId: body.organizationId,
      currency: body.currency,
      productId: body.productId,
      orderId: body.orderId,
      amountMinor: body.amountMinor,
      rail: body.rail,
    });
    return { payload, uri: this.qr.encodeToUri(payload) };
  }

  /** Operational telemetry hook — no funds movement (Instruction 8 §14). */
  @Post("simulate-scan")
  async simulateScan(
    @Body() body: { organizationId: string; qrPayload?: string; regionCode?: string },
  ) {
    await this.flags.requireEnabled("qr_enabled", body.organizationId, body.regionCode);
    this.orchestrator.notifyQrScanned(body.organizationId, { qrPayload: body.qrPayload ?? null });
    return { ok: true };
  }
}
