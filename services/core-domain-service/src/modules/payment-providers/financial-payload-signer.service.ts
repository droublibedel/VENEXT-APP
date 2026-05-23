import { createHmac, randomBytes, timingSafeEqual } from "crypto";
import { Injectable } from "@nestjs/common";

const DEV_SECRET = "venext-dev-only-financial-secret-change-in-production";

/**
 * Signed intents + nonces — replay protection uses nonce store in orchestrator (Instruction 8 §13).
 */
@Injectable()
export class FinancialPayloadSignerService {
  private secret(): string {
    return process.env.FINANCIAL_PAYLOAD_SECRET?.trim() || DEV_SECRET;
  }

  nonce(): string {
    return randomBytes(16).toString("hex");
  }

  signCanonical(payload: Record<string, unknown>): string {
    const keys = Object.keys(payload).sort();
    const canonical = keys.map((k) => `${k}:${JSON.stringify(payload[k])}`).join("|");
    return createHmac("sha256", this.secret()).update(canonical).digest("hex");
  }

  verify(payload: Record<string, unknown>, signature: string): boolean {
    const expected = this.signCanonical(payload);
    try {
      const a = Buffer.from(expected, "hex");
      const b = Buffer.from(signature, "hex");
      if (a.length !== b.length || a.length === 0) return false;
      return timingSafeEqual(a, b);
    } catch {
      return false;
    }
  }
}
