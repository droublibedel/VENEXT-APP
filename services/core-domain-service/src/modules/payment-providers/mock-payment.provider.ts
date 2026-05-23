import { Injectable } from "@nestjs/common";
import type { PaymentProviderAdapter, ProviderPaymentIntent, ProviderPaymentResult } from "./payment-provider.types";

@Injectable()
export class MockPaymentProvider implements PaymentProviderAdapter {
  readonly id = "mock_payment_provider";

  async execute(
    intent: ProviderPaymentIntent,
    options?: { simulateFail?: boolean; delayMs?: number },
  ): Promise<ProviderPaymentResult> {
    const delayMs = options?.delayMs ?? 0;
    if (delayMs > 0) {
      await new Promise((r) => setTimeout(r, delayMs));
    }
    if (options?.simulateFail) {
      return {
        ok: false,
        providerReference: `mock-fail-${intent.transactionId.slice(0, 8)}`,
        latencyMs: delayMs,
        message: "simulated_provider_failure",
      };
    }
    return {
      ok: true,
      providerReference: `mock-ok-${intent.transactionId.slice(0, 8)}`,
      latencyMs: delayMs,
    };
  }
}
