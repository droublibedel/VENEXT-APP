import { describe, expect, it } from "vitest";

import {
  DEMO_ORGANIZATION_SLUG_TO_UUID,
  isDemoOrganizationSlug,
  resolveCommerceOrganizationId,
} from "./resolve-demo-organization";

describe("resolveCommerceOrganizationId ARCHI-05", () => {
  it("maps grossiste demo slug to UUID", () => {
    expect(resolveCommerceOrganizationId("org-grossiste-b-demo")).toBe(
      "31111111-1111-1111-1111-111111111103",
    );
  });

  it("passes through UUID unchanged", () => {
    const uuid = "31111111-1111-1111-1111-111111111101";
    expect(resolveCommerceOrganizationId(uuid)).toBe(uuid);
  });

  describe.each(Object.entries(DEMO_ORGANIZATION_SLUG_TO_UUID))("slug %s", (slug, uuid) => {
    it("is a demo slug", () => {
      expect(isDemoOrganizationSlug(slug)).toBe(true);
      expect(resolveCommerceOrganizationId(slug)).toBe(uuid);
    });
  });
});
