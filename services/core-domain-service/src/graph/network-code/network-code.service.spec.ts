import { describe, expect, it, vi } from "vitest";
import { NetworkCodeService } from "./network-code.service";

describe("NetworkCodeService.join", () => {
  it("creates a pending relationship via invite (default policy)", async () => {
    const prisma = {
      networkCode: {
        findUnique: vi.fn().mockResolvedValue({
          id: "nc-1",
          code: "VX-TEST",
          organizationId: "owner-org",
          active: true,
          expiresAt: null,
          usageLimit: null,
          usageCount: 0,
        }),
        update: vi.fn().mockResolvedValue({}),
      },
    };
    const invite = vi.fn().mockResolvedValue({ id: "rel-new", status: "PENDING" });
    const relationships = { invite };
    const signals = { networkCodeUsed: vi.fn().mockResolvedValue({}) };

    const svc = new NetworkCodeService(
      prisma as never,
      relationships as never,
      signals as never,
    );

    const result = await svc.join("VX-TEST", "joiner-org");

    expect(prisma.networkCode.update).toHaveBeenCalled();
    expect(signals.networkCodeUsed).toHaveBeenCalledWith(
      "VX-TEST",
      "owner-org",
      "joiner-org",
    );
    expect(invite).toHaveBeenCalledWith({
      requesterOrganizationId: "joiner-org",
      receiverOrganizationId: "owner-org",
      source: "NETWORK_CODE",
    });
    expect(result.status).toBe("PENDING");
  });
});
