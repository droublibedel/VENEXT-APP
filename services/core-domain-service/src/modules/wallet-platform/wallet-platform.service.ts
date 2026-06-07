import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { createHash } from "node:crypto";
import { Prisma } from "@prisma/client";
import { Decimal } from "@prisma/client/runtime/library";
import {
  WalletActivityEventType,
  WalletIdentityDocumentType,
  WalletKycStatus,
  WalletProviderCode,
} from "@prisma/client";

import { PrismaService } from "../../prisma/prisma.service";
import { FinancialFeaturesService } from "../financial-feature-flags/financial-features.service";
import type { WalletKycSubmitBody, WalletMeResponse } from "./wallet-platform.types";
import { WALLET_PLATFORM_FEATURE_KEYS } from "./wallet-platform.types";

const DEFAULT_CURRENCY = "XOF";
const BCEAO_THRESHOLD_FCFA = 1000;

@Injectable()
export class WalletPlatformService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly financialFlags: FinancialFeaturesService,
  ) {}

  async resolveFeatureFlags(organizationId: string): Promise<Record<string, boolean>> {
    const base = await this.financialFlags.snapshotForOrg(organizationId);
    const out: Record<string, boolean> = { ...base };
    for (const key of WALLET_PLATFORM_FEATURE_KEYS) {
      out[key] = await this.financialFlags.isEnabled(key, organizationId);
    }
    return out;
  }

  private async ensureWalletLedger(organizationId: string) {
    let wallet = await this.prisma.wallet.findFirst({
      where: { organizationId, currency: DEFAULT_CURRENCY },
    });
    if (!wallet) {
      wallet = await this.prisma.wallet.create({
        data: {
          organizationId,
          currency: DEFAULT_CURRENCY,
          balance: new Decimal(0),
          status: "ACTIVE",
        },
      });
    }
    return wallet;
  }

  private async ensureWalletAccount(organizationId: string) {
    const wallet = await this.ensureWalletLedger(organizationId);
    let account = await this.prisma.walletAccount.findUnique({
      where: { organizationId },
      include: {
        kycProfile: true,
        biometric: true,
        security: true,
        devices: { where: { revokedAt: null }, orderBy: { lastActiveAt: "desc" }, take: 8 },
      },
    });
    if (!account) {
      account = await this.prisma.walletAccount.create({
        data: {
          organizationId,
          walletId: wallet.id,
          kycStatus: WalletKycStatus.PENDING,
          security: { create: {} },
          biometric: { create: { enabled: false } },
        },
        include: {
          kycProfile: true,
          biometric: true,
          security: true,
          devices: { where: { revokedAt: null }, orderBy: { lastActiveAt: "desc" }, take: 8 },
        },
      });
    }
    return { wallet, account };
  }

  private balanceFcfa(balance: Decimal): number {
    return Math.round(Number(balance));
  }

  async getMe(organizationId: string, deviceId?: string): Promise<WalletMeResponse> {
    if (!organizationId) throw new BadRequestException("organizationId required");
    const flags = await this.resolveFeatureFlags(organizationId);
    const { wallet, account } = await this.ensureWalletAccount(organizationId);

    if (deviceId) {
      await this.prisma.walletTrustedDevice.upsert({
        where: { walletAccountId_deviceId: { walletAccountId: account.id, deviceId } },
        create: {
          walletAccountId: account.id,
          deviceId,
          fingerprint: createHash("sha256").update(deviceId).digest("hex").slice(0, 32),
          label: "Appareil mobile",
          trusted: true,
          lastActiveAt: new Date(),
        },
        update: { lastActiveAt: new Date() },
      });
    }

    const balance = this.balanceFcfa(wallet.balance);
    if (balance >= BCEAO_THRESHOLD_FCFA && account.kycStatus === WalletKycStatus.ACTIVE) {
      await this.prisma.walletSessionSecurityState.updateMany({
        where: { walletAccountId: account.id },
        data: { securedBalanceLatch: true },
      });
    }

    return {
      organizationId,
      walletId: wallet.id,
      accountId: account.id,
      balanceFcfa: balance,
      currency: wallet.currency,
      kycStatus: account.kycStatus,
      walletActivated: account.kycStatus === WalletKycStatus.ACTIVE,
      locked: account.locked,
      biometricEnabled: account.biometric?.enabled ?? false,
      featureFlags: flags,
      activeSessions: (account.devices ?? []).map((d) => ({
        deviceId: d.deviceId,
        label: d.label || "Appareil",
        lastActiveAt: d.lastActiveAt.toISOString(),
        trusted: d.trusted,
      })),
    };
  }

  async submitKyc(body: WalletKycSubmitBody) {
    const { wallet, account } = await this.ensureWalletAccount(body.organizationId);
    if (!(await this.financialFlags.isEnabled("wallet_kyc_enabled", body.organizationId))) {
      throw new BadRequestException({ code: "wallet_kyc_disabled" });
    }

    const docType = body.documentType as WalletIdentityDocumentType;
    await this.prisma.walletKycProfile.upsert({
      where: { walletAccountId: account.id },
      create: {
        walletAccountId: account.id,
        civilFullName: body.civilFullName.trim(),
        birthDate: body.birthDate ? new Date(body.birthDate) : null,
        submittedAt: new Date(),
      },
      update: {
        civilFullName: body.civilFullName.trim(),
        birthDate: body.birthDate ? new Date(body.birthDate) : null,
        submittedAt: new Date(),
      },
    });

    if (body.documentBase64) {
      await this.prisma.walletIdentityDocument.create({
        data: {
          walletAccountId: account.id,
          documentType: docType,
          storageKey: `kyc/${account.id}/${Date.now()}`,
          mimeType: body.documentMimeType ?? "image/jpeg",
          fileName: body.documentFileName ?? "identity.jpg",
        },
      });
    }

    const nextStatus =
      body.civilFullName.trim().length >= 3
        ? WalletKycStatus.UNDER_REVIEW
        : WalletKycStatus.PENDING;

    await this.prisma.walletAccount.update({
      where: { id: account.id },
      data: { kycStatus: nextStatus },
    });

    await this.logActivity(account.id, WalletActivityEventType.KYC_SUBMITTED, {
      documentType: body.documentType,
    });

    return this.getMe(body.organizationId);
  }

  async activateWallet(organizationId: string) {
    const { account } = await this.ensureWalletAccount(organizationId);
    const profile = await this.prisma.walletKycProfile.findUnique({
      where: { walletAccountId: account.id },
    });
    if (!profile?.civilFullName) {
      throw new BadRequestException({ code: "kyc_incomplete" });
    }

    await this.prisma.walletAccount.update({
      where: { id: account.id },
      data: {
        kycStatus: WalletKycStatus.ACTIVE,
        activatedAt: new Date(),
      },
    });

    await this.logActivity(account.id, WalletActivityEventType.WALLET_ACTIVATED, {});
    return this.getMe(organizationId);
  }

  async listTransactions(organizationId: string) {
    const { wallet } = await this.ensureWalletAccount(organizationId);
    return this.prisma.transaction.findMany({
      where: { walletId: wallet.id },
      orderBy: { createdAt: "desc" },
      take: 100,
    });
  }

  async lockWallet(organizationId: string, reason = "manual") {
    const { account } = await this.ensureWalletAccount(organizationId);
    await this.prisma.walletAccount.update({
      where: { id: account.id },
      data: { locked: true },
    });
    await this.logActivity(account.id, WalletActivityEventType.WALLET_LOCKED, { reason });
    return { ok: true, locked: true };
  }

  async unlockWallet(organizationId: string, pin?: string) {
    const { account } = await this.ensureWalletAccount(organizationId);
    const security = await this.prisma.walletSessionSecurityState.findUnique({
      where: { walletAccountId: account.id },
    });
    if (security?.pinConfigured && pin) {
      const hash = createHash("sha256").update(pin).digest("hex");
      if (hash !== security.pinHash) {
        throw new BadRequestException({ code: "pin_mismatch" });
      }
    }
    const now = new Date();
    await this.prisma.walletAccount.update({
      where: { id: account.id },
      data: { locked: false, lastUnlockedAt: now, lastActivityAt: now },
    });
    await this.logActivity(account.id, WalletActivityEventType.WALLET_UNLOCKED, {});
    return { ok: true, locked: false };
  }

  async configurePin(organizationId: string, pin: string) {
    if (!/^\d{4}$/.test(pin)) throw new BadRequestException({ code: "pin_invalid" });
    const { account } = await this.ensureWalletAccount(organizationId);
    const hash = createHash("sha256").update(pin).digest("hex");
    await this.prisma.walletSessionSecurityState.upsert({
      where: { walletAccountId: account.id },
      create: { walletAccountId: account.id, pinConfigured: true, pinHash: hash },
      update: { pinConfigured: true, pinHash: hash },
    });
    return { ok: true };
  }

  async setBiometric(organizationId: string, enabled: boolean) {
    const { account } = await this.ensureWalletAccount(organizationId);
    if (!(await this.financialFlags.isEnabled("wallet_biometric_enabled", organizationId))) {
      throw new BadRequestException({ code: "wallet_biometric_disabled" });
    }
    await this.prisma.walletBiometricPreference.upsert({
      where: { walletAccountId: account.id },
      create: { walletAccountId: account.id, enabled },
      update: { enabled },
    });
    await this.logActivity(
      account.id,
      enabled ? WalletActivityEventType.BIOMETRIC_ENABLED : WalletActivityEventType.BIOMETRIC_DISABLED,
      {},
    );
    return { ok: true, enabled };
  }

  async recordInactivityLock(organizationId: string) {
    const { account } = await this.ensureWalletAccount(organizationId);
    await this.prisma.walletAccount.update({
      where: { id: account.id },
      data: { locked: true },
    });
    await this.prisma.walletSessionSecurityState.updateMany({
      where: { walletAccountId: account.id },
      data: { inactivityLockCount: { increment: 1 }, lastInactivityLockAt: new Date() },
    });
    await this.logActivity(account.id, WalletActivityEventType.INACTIVITY_LOCK, {});
    return { ok: true };
  }

  async touchActivity(organizationId: string) {
    const { account } = await this.ensureWalletAccount(organizationId);
    await this.prisma.walletAccount.update({
      where: { id: account.id },
      data: { lastActivityAt: new Date() },
    });
    return { ok: true };
  }

  async topup(organizationId: string, amountFcfa: number, provider: WalletProviderCode = WalletProviderCode.ORANGE_MONEY) {
    if (amountFcfa <= 0) throw new BadRequestException({ code: "amount_invalid" });
    const { wallet, account } = await this.ensureWalletAccount(organizationId);
    await this.logActivity(account.id, WalletActivityEventType.TOPUP_STARTED, { amountFcfa, provider });

    const tx = await this.prisma.$transaction(async (db) => {
      const providerTx = await db.walletProviderTransaction.create({
        data: {
          walletAccountId: account.id,
          provider,
          amount: new Decimal(amountFcfa),
          currency: DEFAULT_CURRENCY,
          direction: "IN",
          status: "POSTED",
        },
      });
      const ledger = await db.transaction.create({
        data: {
          walletId: wallet.id,
          organizationId,
          type: "CREDIT",
          amount: new Decimal(amountFcfa),
          currency: DEFAULT_CURRENCY,
          status: "POSTED",
          provider,
          reference: providerTx.id,
        },
      });
      await db.wallet.update({
        where: { id: wallet.id },
        data: { balance: { increment: amountFcfa } },
      });
      return { providerTx, ledger };
    });

    const balance = this.balanceFcfa(
      (await this.prisma.wallet.findUniqueOrThrow({ where: { id: wallet.id } })).balance,
    );
    if (balance >= BCEAO_THRESHOLD_FCFA) {
      await this.logActivity(account.id, WalletActivityEventType.BALANCE_THRESHOLD_REACHED, { balance });
    }
    await this.logActivity(account.id, WalletActivityEventType.TOPUP_COMPLETED, {
      amountFcfa,
      transactionId: tx.ledger.id,
    });
    return this.getMe(organizationId);
  }

  async revokeSession(organizationId: string, deviceId: string) {
    const account = await this.prisma.walletAccount.findUnique({ where: { organizationId } });
    if (!account) throw new NotFoundException("wallet_account");
    await this.prisma.walletTrustedDevice.updateMany({
      where: { walletAccountId: account.id, deviceId },
      data: { revokedAt: new Date(), trusted: false },
    });
    await this.logActivity(account.id, WalletActivityEventType.SESSION_REVOKED, { deviceId });
    return { ok: true };
  }

  private async logActivity(
    walletAccountId: string,
    eventType: WalletActivityEventType,
    payload: Record<string, unknown>,
    deviceId = "",
  ) {
    await this.prisma.walletActivityLog.create({
      data: {
        walletAccountId,
        eventType,
        payload: payload as Prisma.InputJsonValue,
        deviceId,
      },
    });
  }
}
