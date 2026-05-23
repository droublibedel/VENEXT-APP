import { describe, expect, it, vi } from "vitest";
import { ContactSuggestionService } from "./contact-suggestion.service";

describe("ContactSuggestionService.importContacts", () => {
  it("does not create Relationship rows (suggestions only)", async () => {
    const relationshipCreate = vi.fn();
    const prisma = {
      organizationMember: {
        findFirst: vi.fn().mockResolvedValue({
          userId: "u1",
          organizationId: "o1",
        }),
      },
      organization: {
        findUnique: vi.fn().mockResolvedValue({
          id: "o1",
          city: "Dakar",
          category: "RETAILER",
        }),
      },
      user: {
        findMany: vi.fn().mockResolvedValue([]),
      },
      relationship: {
        findFirst: vi.fn().mockResolvedValue(null),
        create: relationshipCreate,
      },
      contactSuggestion: {
        findFirst: vi.fn().mockResolvedValue(null),
        create: vi.fn().mockResolvedValue({
          id: "s1",
          score: 50,
          reason: "mutual_phone_contact",
          source: "CONTACT_SYNC",
          suggestedOrganization: {
            displayName: "X",
            category: "WHOLESALER_A",
            city: "Dakar",
          },
        }),
      },
      order: { findFirst: vi.fn().mockResolvedValue(null) },
      negotiation: { findFirst: vi.fn().mockResolvedValue(null) },
    };
    const signals = {
      contactSuggestionsGenerated: vi.fn().mockResolvedValue({}),
    };

    const svc = new ContactSuggestionService(prisma as never, signals as never);

    await svc.importContacts({
      userId: "u1",
      organizationId: "o1",
      contacts: [{ phoneNumber: "+221700000002" }],
    });

    expect(relationshipCreate).not.toHaveBeenCalled();
  });
});
