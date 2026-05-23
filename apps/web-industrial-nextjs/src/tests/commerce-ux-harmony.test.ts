import { describe, expect, it } from "vitest";

import {
  auditVisibleCopy,
  evaluateMobileSurfaceHarmony,
  getEmptyStateMessage,
  runCommerceUxHarmonyAudit,
} from "commerce-ux-harmony";

describe("industrial web UX harmony", () => {
  it("formal audit passes clean labels", () => {
    const r = runCommerceUxHarmonyAudit({
      platform: "web",
      actorKind: "formal",
      depth: 2,
      quickActionCount: 6,
      panelCount: 2,
      visibleLabels: ["Commandes partenaires", "Mail professionnel"],
    });
    expect(r.ok).toBe(true);
  });

  it("web allows denser quick actions", () => {
    expect(
      evaluateMobileSurfaceHarmony({
        platform: "web",
        quickActionCount: 7,
        panelCount: 2,
      }).ok,
    ).toBe(true);
  });

  it("relations empty commerce-first", () => {
    expect(getEmptyStateMessage("relations", "fr-CI", "formal")).toMatch(/relation/i);
  });

  it("rejects pipeline jargon", () => {
    expect(auditVisibleCopy("sales pipeline").ok).toBe(false);
  });

  it("en notifications empty", () => {
    expect(getEmptyStateMessage("notifications", "en")).toMatch(/notification/i);
  });
});
