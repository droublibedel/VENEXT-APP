/**
 * VENEXT-WALLET-SECURITY-01 — passerelle Mobile Money (architecture réelle, providers branchables).
 */
export type MobileMoneyProviderCode = "ORANGE_MONEY" | "MTN_MONEY" | "WAVE" | "MOOV_MONEY" | "OTHER";

export type MobileMoneyTopupRequest = {
  organizationId: string;
  amountFcfa: number;
  provider: MobileMoneyProviderCode;
  msisdn?: string;
};

export type MobileMoneyTopupResult = {
  ok: boolean;
  providerRef?: string;
  status: "PENDING" | "POSTED" | "FAILED";
};

export interface MobileMoneyProviderGateway {
  readonly code: MobileMoneyProviderCode;
  initiateTopup(req: MobileMoneyTopupRequest): Promise<MobileMoneyTopupResult>;
}

export class OrangeMoneyProviderGateway implements MobileMoneyProviderGateway {
  readonly code = "ORANGE_MONEY" as const;
  async initiateTopup(req: MobileMoneyTopupRequest): Promise<MobileMoneyTopupResult> {
    return { ok: true, status: "PENDING", providerRef: `om-${req.organizationId}-${Date.now()}` };
  }
}

export class MtnMoneyProviderGateway implements MobileMoneyProviderGateway {
  readonly code = "MTN_MONEY" as const;
  async initiateTopup(req: MobileMoneyTopupRequest): Promise<MobileMoneyTopupResult> {
    return { ok: true, status: "PENDING", providerRef: `mtn-${req.organizationId}-${Date.now()}` };
  }
}

export class WaveProviderGateway implements MobileMoneyProviderGateway {
  readonly code = "WAVE" as const;
  async initiateTopup(req: MobileMoneyTopupRequest): Promise<MobileMoneyTopupResult> {
    return { ok: true, status: "PENDING", providerRef: `wave-${req.organizationId}-${Date.now()}` };
  }
}

export class MoovMoneyProviderGateway implements MobileMoneyProviderGateway {
  readonly code = "MOOV_MONEY" as const;
  async initiateTopup(req: MobileMoneyTopupRequest): Promise<MobileMoneyTopupResult> {
    return { ok: true, status: "PENDING", providerRef: `moov-${req.organizationId}-${Date.now()}` };
  }
}

export function createMobileMoneyProviderRegistry(): Map<MobileMoneyProviderCode, MobileMoneyProviderGateway> {
  return new Map<MobileMoneyProviderCode, MobileMoneyProviderGateway>([
    ["ORANGE_MONEY", new OrangeMoneyProviderGateway()],
    ["MTN_MONEY", new MtnMoneyProviderGateway()],
    ["WAVE", new WaveProviderGateway()],
    ["MOOV_MONEY", new MoovMoneyProviderGateway()],
  ]);
}
