import {
  OrganizationActorType,
  OrganizationCategory,
} from "@prisma/client";
import { describe, expect, it, vi } from "vitest";
import { OrganizationsService } from "./organizations.service";

describe("OrganizationsService.createOrganization", () => {
  it("assigns a unique 10-digit commercialId on creation", async () => {
    const create = vi.fn().mockResolvedValue({
      id: "new-org",
      commercialId: "0000000042",
    });
    const findUnique = vi
      .fn()
      .mockResolvedValueOnce({ id: "collision" })
      .mockResolvedValue(null);

    const prisma = {
      organization: {
        findUnique,
        create,
      },
    };

    const svc = new OrganizationsService(prisma as never);
    await svc.createOrganization({
      owner: { connect: { id: "21111111-1111-1111-1111-111111111101" } },
      displayName: "Test Org",
      activityLabel: "Test",
      actorType: OrganizationActorType.RETAILER,
      category: OrganizationCategory.RETAILER,
      country: "SN",
      city: "Dakar",
    });

    expect(create).toHaveBeenCalled();
    const arg = create.mock.calls[0]![0].data as { commercialId: string };
    expect(arg.commercialId).toMatch(/^\d{10}$/);
  });
});
