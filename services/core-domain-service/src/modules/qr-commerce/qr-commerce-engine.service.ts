import { Injectable } from "@nestjs/common";
import { FinancialPayloadSignerService } from "../payment-providers/financial-payload-signer.service";

export type QrKind =
  | "merchant_payment"
  | "payment_request"
  | "contextual"
  | "product_linked"
  | "order_linked";

export type QrCommercePayloadV2 = {
  v: 2;
  kind: QrKind;
  /** Hybrid routing: wallet | external | hybrid */
  rail: "wallet" | "external" | "hybrid";
  organizationId: string;
  currency: string;
  productId?: string | null;
  orderId?: string | null;
  amountMinor?: number | null;
  label?: string | null;
  exp: number;
  nonce: string;
  sig: string;
};

/**
 * Dynamic commerce QR — not a static bank QR (Instruction 8 §4).
 */
@Injectable()
export class QrCommerceEngineService {
  constructor(private readonly signer: FinancialPayloadSignerService) {}

  buildPayload(input: {
    kind: QrKind;
    rail?: "wallet" | "external" | "hybrid";
    organizationId: string;
    currency: string;
    productId?: string | null;
    orderId?: string | null;
    amountMinor?: number | null;
    label?: string | null;
    ttlSec?: number;
  }): QrCommercePayloadV2 {
    const exp = Math.floor(Date.now() / 1000) + (input.ttlSec ?? 600);
    const nonce = this.signer.nonce();
    const rail = input.rail ?? "hybrid";
    const body = {
      v: 2 as const,
      kind: input.kind,
      rail,
      organizationId: input.organizationId,
      currency: input.currency,
      productId: input.productId ?? null,
      orderId: input.orderId ?? null,
      amountMinor: input.amountMinor ?? null,
      label: input.label ?? null,
      exp,
      nonce,
    };
    const sig = this.signer.signCanonical(body as unknown as Record<string, unknown>);
    return { ...body, sig };
  }

  encodeToUri(payload: QrCommercePayloadV2): string {
    const b64 = Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
    return `venext://qr/v2/${b64}`;
  }
}
