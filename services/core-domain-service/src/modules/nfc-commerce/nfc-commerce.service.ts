import { Injectable } from "@nestjs/common";
import { FinancialPayloadSignerService } from "../payment-providers/financial-payload-signer.service";

export type NfcPaymentIntent = {
  intentId: string;
  organizationId: string;
  currency: string;
  amountMinor?: number | null;
  productId?: string | null;
  nonce: string;
  sig: string;
};

/**
 * NFC-ready abstraction — no vendor SDK (Instruction 8 §6).
 */
@Injectable()
export class NfcCommerceService {
  constructor(private readonly signer: FinancialPayloadSignerService) {}

  createIntent(input: {
    organizationId: string;
    currency: string;
    amountMinor?: number | null;
    productId?: string | null;
  }): NfcPaymentIntent {
    const intentId = `nfc-${this.signer.nonce().slice(0, 12)}`;
    const nonce = this.signer.nonce();
    const canonical = {
      intentId,
      organizationId: input.organizationId,
      currency: input.currency,
      amountMinor: input.amountMinor ?? null,
      productId: input.productId ?? null,
      nonce,
    };
    const sig = this.signer.signCanonical(canonical);
    return { ...canonical, sig };
  }
}
