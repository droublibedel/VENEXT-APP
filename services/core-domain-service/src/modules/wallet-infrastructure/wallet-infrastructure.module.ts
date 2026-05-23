import { Module } from "@nestjs/common";
import { FeatureFlagsModule } from "../../feature-flags/feature-flags.module";
import { PrismaModule } from "../../prisma/prisma.module";
import { FinancialBackofficeController } from "../financial-backoffice/financial-backoffice.controller";
import { FinancialFeatureFlagsController } from "../financial-feature-flags/financial-feature-flags.controller";
import { FinancialFeaturesService } from "../financial-feature-flags/financial-features.service";
import { NfcCommerceController } from "../nfc-commerce/nfc-commerce.controller";
import { NfcCommerceService } from "../nfc-commerce/nfc-commerce.service";
import { FinancialPayloadSignerService } from "../payment-providers/financial-payload-signer.service";
import { MockPaymentProvider } from "../payment-providers/mock-payment.provider";
import { PaymentsController } from "../payments/payments.controller";
import { QrCommerceController } from "../qr-commerce/qr-commerce.controller";
import { QrCommerceEngineService } from "../qr-commerce/qr-commerce-engine.service";
import { TransactionEngineController } from "../transaction-engine/transaction-engine.controller";
import { TransactionOrchestratorService } from "../transaction-engine/transaction-orchestrator.service";
import { WalletCoreController } from "../wallet/wallet-core.controller";
import { WalletCoreService } from "../wallet/wallet-core.service";

/**
 * Instruction 8 — wallet / QR / NFC / payments / transaction orchestration / financial flags.
 */
@Module({
  imports: [PrismaModule, FeatureFlagsModule],
  controllers: [
    WalletCoreController,
    QrCommerceController,
    NfcCommerceController,
    TransactionEngineController,
    PaymentsController,
    FinancialBackofficeController,
    FinancialFeatureFlagsController,
  ],
  providers: [
    FinancialFeaturesService,
    FinancialPayloadSignerService,
    MockPaymentProvider,
    TransactionOrchestratorService,
    QrCommerceEngineService,
    NfcCommerceService,
    WalletCoreService,
  ],
  exports: [FinancialFeaturesService, TransactionOrchestratorService, QrCommerceEngineService],
})
export class WalletInfrastructureModule {}
