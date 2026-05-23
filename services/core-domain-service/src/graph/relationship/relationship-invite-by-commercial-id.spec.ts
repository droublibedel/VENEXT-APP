import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from "@nestjs/common";
import {
  OrganizationActorType,
  OrganizationCategory,
  OrganizationVerificationStatus,
  RelationshipSource,
  RelationshipStatus,
} from "@prisma/client";
import { describe, expect, it, vi } from "vitest";
import { RelationshipService } from "./relationship.service";

function baseOrg(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: "31111111-1111-1111-1111-111111111201",
    commercialId: "8829173043",
    displayName: "Retailer",
    activityLabel: "Retail",
    actorType: OrganizationActorType.RETAILER,
    category: OrganizationCategory.RETAILER,
    country: "SN",
    city: "Dakar",
    verificationStatus: OrganizationVerificationStatus.PENDING,
    credibilityScore: 0.5,
    profileImageUrl: null,
    ...overrides,
  };
}

describe("RelationshipService.inviteByCommercialId", () => {
  it("rejects invalid commercialId format", async () => {
    const prisma = { organization: { findUnique: vi.fn() } };
    const svc = new RelationshipService(
      prisma as never,
      {} as never,
      { invitationSent: vi.fn() } as never,
      {} as never,
    );
    await expect(
      svc.inviteByCommercialId({
        requesterOrganizationId: "31111111-1111-1111-1111-111111111102",
        targetCommercialId: "123",
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.organization.findUnique).not.toHaveBeenCalled();
  });

  it("rejects unknown commercialId", async () => {
    const prisma = {
      organization: {
        findUnique: vi.fn().mockResolvedValue(null),
      },
    };
    const svc = new RelationshipService(
      prisma as never,
      {} as never,
      { invitationSent: vi.fn() } as never,
      {} as never,
    );
    await expect(
      svc.inviteByCommercialId({
        requesterOrganizationId: "31111111-1111-1111-1111-111111111102",
        targetCommercialId: "0000000000",
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it("rejects self-invitation", async () => {
    const prisma = {
      organization: {
        findUnique: vi.fn().mockResolvedValue(baseOrg()),
      },
    };
    const svc = new RelationshipService(
      prisma as never,
      {} as never,
      { invitationSent: vi.fn() } as never,
      {} as never,
    );
    await expect(
      svc.inviteByCommercialId({
        requesterOrganizationId: "31111111-1111-1111-1111-111111111201",
        targetCommercialId: "8829173043",
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it("creates pending relationship and returns preview", async () => {
    const target = baseOrg({
      id: "31111111-1111-1111-1111-111111111104",
      commercialId: "7829173044",
      category: OrganizationCategory.WHOLESALER_B,
      actorType: OrganizationActorType.WHOLESALER,
    });
    const requester = baseOrg({
      id: "31111111-1111-1111-1111-111111111201",
      commercialId: "8829173043",
    });

    const prisma = {
      organization: {
        findUnique: vi.fn().mockImplementation(async ({ where }) => {
          if ("commercialId" in where && where.commercialId === "7829173044") {
            return target;
          }
          if ("id" in where && where.id === requester.id) return requester;
          if ("id" in where && where.id === target.id) return target;
          return null;
        }),
      },
    };

    const repo = {
      findPendingBetweenOrgPair: vi.fn().mockResolvedValue(null),
      acceptedBetween: vi.fn().mockResolvedValue(null),
      createInvite: vi.fn().mockResolvedValue({
        id: "51111111-1111-1111-1111-111111111001",
        status: RelationshipStatus.PENDING,
        requesterOrganizationId: requester.id,
        receiverOrganizationId: target.id,
        source: RelationshipSource.MANUAL_INVITATION,
      }),
    };

    const signals = { invitationSent: vi.fn().mockResolvedValue({}) };

    const svc = new RelationshipService(
      prisma as never,
      repo as never,
      signals as never,
      {} as never,
    );

    const out = await svc.inviteByCommercialId({
      requesterOrganizationId: requester.id,
      targetCommercialId: "782-917-3044",
    });

    expect(out.status).toBe("PENDING");
    expect(out.relationshipId).toBe("51111111-1111-1111-1111-111111111001");
    expect(out.targetPreview.commercialId).toBe("7829173044");
    expect(out.targetPreview.organizationName).toBe("Retailer");
    expect(repo.createInvite).toHaveBeenCalled();
  });

  it("propagates duplicate pending invite as conflict", async () => {
    const target = baseOrg({
      id: "31111111-1111-1111-1111-111111111104",
      commercialId: "7829173044",
      category: OrganizationCategory.WHOLESALER_B,
      actorType: OrganizationActorType.WHOLESALER,
    });
    const requester = baseOrg();

    const prisma = {
      organization: {
        findUnique: vi.fn().mockImplementation(async ({ where }) => {
          if ("commercialId" in where && where.commercialId === "7829173044") {
            return target;
          }
          if ("id" in where && where.id === requester.id) return requester;
          if ("id" in where && where.id === target.id) return target;
          return null;
        }),
      },
    };

    const repo = {
      findPendingBetweenOrgPair: vi.fn().mockResolvedValue({ id: "dup" }),
      acceptedBetween: vi.fn().mockResolvedValue(null),
      createInvite: vi.fn(),
    };

    const svc = new RelationshipService(
      prisma as never,
      repo as never,
      { invitationSent: vi.fn() } as never,
      {} as never,
    );

    await expect(
      svc.inviteByCommercialId({
        requesterOrganizationId: requester.id,
        targetCommercialId: "7829173044",
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });
});
