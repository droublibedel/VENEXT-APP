import type { TransactionType } from "@prisma/client";

export type ProviderPaymentIntent = {
  transactionId: string;
  amount: string;
  currency: string;
  type: TransactionType;
  reference: string;
  metadata: Record<string, unknown>;
};

export type ProviderPaymentResult = {
  ok: boolean;
  providerReference: string;
  latencyMs: number;
  message?: string;
};

/**
 * Abstraction for Orange / MTN / Wave / cards / aggregators (Instruction 8 §8).
 * No live PSP wiring in this repository.
 */
export interface PaymentProviderAdapter {
  readonly id: string;
  execute(intent: ProviderPaymentIntent, options?: { simulateFail?: boolean; delayMs?: number }): Promise<ProviderPaymentResult>;
}
