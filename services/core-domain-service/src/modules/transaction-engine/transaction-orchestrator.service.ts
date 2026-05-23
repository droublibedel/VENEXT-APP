import {
  BadRequestException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from "@nestjs/common";
import { Prisma, TransactionStatus, TransactionType, WalletStatus } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";
import { FinancialFeaturesService } from "../financial-feature-flags/financial-features.service";
import { FinancialPayloadSignerService } from "../payment-providers/financial-payload-signer.service";
import { MockPaymentProvider } from "../payment-providers/mock-payment.provider";

const d = (n: string | number) => new Prisma.Decimal(n);

type InitiateInput = {
  walletId: string;
  organizationId: string;
  type: TransactionType;
  amount: number;
  currency: string;
  idempotencyKey?: string | null;
  /** CREDIT to this wallet (inbound); DEBIT/TRANSFER from this wallet */
  direction: "INBOUND" | "OUTBOUND";
  /** For TRANSFER — credit destination wallet */
  counterpartyWalletId?: string | null;
  providerOptions?: { simulateFail?: boolean; delayMs?: number };
  regionCode?: string;
};

/**
 * Orchestrated commerce transactions — no balance mutation until SUCCESS (Instruction 8 §9).
 */
@Injectable()
export class TransactionOrchestratorService {
  private readonly recentNonces = new Map<string, number>();
  private readonly recentEvents: { ts: string; type: string; payload: Record<string, unknown> }[] = [];

  constructor(
    private readonly prisma: PrismaService,
    private readonly flags: FinancialFeaturesService,
    private readonly signer: FinancialPayloadSignerService,
    private readonly mock: MockPaymentProvider,
  ) {
    setInterval(() => this.gcNonces(), 60_000).unref?.();
  }

  private gcNonces() {
    const now = Date.now();
    for (const [k, exp] of this.recentNonces) {
      if (exp < now) this.recentNonces.delete(k);
    }
  }

  private pushEvent(type: string, payload: Record<string, unknown>) {
    const row = { ts: new Date().toISOString(), type, payload };
    this.recentEvents.push(row);
    if (this.recentEvents.length > 200) this.recentEvents.splice(0, this.recentEvents.length - 200);
  }

  recentFinancialEvents() {
    return [...this.recentEvents].reverse();
  }

  findTransaction(id: string) {
    return this.prisma.transaction.findUnique({ where: { id } });
  }

  /** Optional hook for QR / NFC layers (Instruction 8 §14). */
  notifyQrScanned(organizationId: string, payload: Record<string, unknown>) {
    this.pushEvent("qr_scanned", { organizationId, ...payload });
  }

  async initiate(input: InitiateInput) {
    await this.flags.requireEnabled("wallet_enabled", input.organizationId, input.regionCode);
    if (input.type === TransactionType.TRANSFER) {
      await this.flags.requireEnabled("transfer_enabled", input.organizationId, input.regionCode);
    } else {
      await this.flags.requireEnabled("payments_enabled", input.organizationId, input.regionCode);
    }

    if (input.idempotencyKey) {
      const existing = await this.prisma.transaction.findFirst({
        where: { idempotencyKey: input.idempotencyKey },
      });
      if (existing) return existing;
    }

    const wallet = await this.prisma.wallet.findUnique({ where: { id: input.walletId } });
    if (!wallet) throw new NotFoundException("wallet");
    if (wallet.organizationId !== input.organizationId) {
      throw new BadRequestException("wallet_org_mismatch");
    }
    if (
      wallet.status === WalletStatus.SUSPENDED ||
      wallet.status === WalletStatus.CLOSED ||
      wallet.status === WalletStatus.FROZEN
    ) {
      throw new ServiceUnavailableException("wallet_not_operational");
    }

    if (input.direction === "OUTBOUND") {
      const bal = wallet.balance;
      if (bal.lt(d(input.amount))) throw new BadRequestException("insufficient_balance");
    }

    let counterparty: { id: string; organizationId: string } | null = null;
    if (input.type === TransactionType.TRANSFER) {
      if (!input.counterpartyWalletId) throw new BadRequestException("counterparty_required");
      const cp = await this.prisma.wallet.findUnique({ where: { id: input.counterpartyWalletId } });
      if (!cp) throw new NotFoundException("counterparty_wallet");
      counterparty = { id: cp.id, organizationId: cp.organizationId };
    }

    const nonce = this.signer.nonce();
    const intent = {
      walletId: input.walletId,
      organizationId: input.organizationId,
      type: input.type,
      amount: input.amount,
      currency: input.currency,
      nonce,
      direction: input.direction,
      counterpartyWalletId: input.counterpartyWalletId ?? null,
    };
    const payloadSignature = this.signer.signCanonical(intent as unknown as Record<string, unknown>);

    if (this.recentNonces.has(nonce)) throw new BadRequestException("nonce_replay");
    this.recentNonces.set(nonce, Date.now() + 300_000);

    return this.prisma.$transaction(async (tx) => {
      const row = await tx.transaction.create({
        data: {
          walletId: input.walletId,
          organizationId: input.organizationId,
          type: input.type,
          amount: d(input.amount),
          currency: input.currency,
          status: TransactionStatus.INITIATED,
          provider: this.mock.id,
          reference: `orc-${nonce.slice(0, 10)}`,
          nonce,
          idempotencyKey: input.idempotencyKey ?? null,
          payloadSignature,
          metadata: {
            auditTrail: [{ at: new Date().toISOString(), step: "initiated", intent }],
            direction: input.direction,
            counterpartyWalletId: input.counterpartyWalletId ?? null,
          } as Prisma.InputJsonValue,
        },
      });

      await tx.transaction.update({
        where: { id: row.id },
        data: { status: TransactionStatus.PROCESSING },
      });

      const providerIntent = {
        transactionId: row.id,
        amount: row.amount.toString(),
        currency: row.currency,
        type: input.type,
        reference: row.reference,
        metadata: { direction: input.direction },
      };

      const result = await this.mock.execute(providerIntent, input.providerOptions);

      if (!result.ok) {
        await tx.transaction.update({
          where: { id: row.id },
          data: {
            status: TransactionStatus.FAILED,
            metadata: {
              auditTrail: [{ at: new Date().toISOString(), step: "provider_failed", result }],
            } as Prisma.InputJsonValue,
          },
        });
        this.pushEvent("payment_failed", { transactionId: row.id, organizationId: input.organizationId });
        return tx.transaction.findUnique({ where: { id: row.id } });
      }

      if (input.type === TransactionType.TRANSFER && counterparty) {
        await tx.wallet.update({
          where: { id: input.walletId },
          data: { balance: { decrement: d(input.amount) } },
        });
        await tx.wallet.update({
          where: { id: counterparty.id },
          data: { balance: { increment: d(input.amount) } },
        });
        await tx.transaction.create({
          data: {
            walletId: counterparty.id,
            organizationId: counterparty.organizationId,
            type: TransactionType.CREDIT,
            amount: d(input.amount),
            currency: input.currency,
            status: TransactionStatus.SUCCESS,
            provider: this.mock.id,
            reference: `mirror-${row.id.slice(0, 8)}`,
            nonce: this.signer.nonce(),
            payloadSignature: "",
            metadata: { pairOf: row.id, auditTrail: [{ at: new Date().toISOString(), step: "transfer_in" }] },
          },
        });
      } else if (input.direction === "INBOUND") {
        await tx.wallet.update({
          where: { id: input.walletId },
          data: { balance: { increment: d(input.amount) } },
        });
        this.pushEvent("payment_received", { walletId: input.walletId, amount: input.amount });
      } else if (input.direction === "OUTBOUND") {
        await tx.wallet.update({
          where: { id: input.walletId },
          data: { balance: { decrement: d(input.amount) } },
        });
      }

      const updated = await tx.transaction.update({
        where: { id: row.id },
        data: {
          status: TransactionStatus.SUCCESS,
          metadata: {
            auditTrail: [
              { at: new Date().toISOString(), step: "success", providerReference: result.providerReference },
            ],
            direction: input.direction,
          } as Prisma.InputJsonValue,
        },
      });

      this.pushEvent("transaction_confirmed", {
        transactionId: row.id,
        organizationId: input.organizationId,
        amount: input.amount,
        currency: input.currency,
      });
      this.pushEvent("wallet_updated", { walletId: input.walletId, organizationId: input.organizationId });
      if (input.type === TransactionType.TRANSFER && counterparty) {
        this.pushEvent("transfer_received", { walletId: counterparty.id, from: input.walletId });
      }
      return updated;
    });
  }

  async validateSignature(input: {
    walletId: string;
    organizationId: string;
    type: TransactionType;
    amount: number;
    currency: string;
    nonce: string;
    direction: string;
    counterpartyWalletId?: string | null;
    payloadSignature: string;
  }) {
    const canonical = {
      walletId: input.walletId,
      organizationId: input.organizationId,
      type: input.type,
      amount: input.amount,
      currency: input.currency,
      nonce: input.nonce,
      direction: input.direction,
      counterpartyWalletId: input.counterpartyWalletId ?? null,
    };
    return this.signer.verify(canonical as unknown as Record<string, unknown>, input.payloadSignature);
  }
}
