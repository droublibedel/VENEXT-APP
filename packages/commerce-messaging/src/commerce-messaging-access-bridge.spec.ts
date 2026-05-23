import { describe, expect, it } from "vitest";

import {
  buildMessagingAccessContext,
  canUseFormalMailWithAccess,
  canUseTerrainMessagingWithAccess,
  isParticipantMessagingAllowed,
} from "./commerce-messaging-access-bridge";

describe("commerce-messaging-access-bridge", () => {
  const flags = { commerce_access_control_enabled: true };

  it("terrain grossiste b", () => {
    const ctx = buildMessagingAccessContext({
      actorRole: "grossiste_b",
      organizationId: "org-b",
      relationshipId: "rel-1",
      flags,
    });
    expect(canUseTerrainMessagingWithAccess(ctx, () => true)).toBe(true);
  });

  it("formal producteur", () => {
    const ctx = buildMessagingAccessContext({
      actorRole: "producteur",
      organizationId: "org-p",
      relationshipId: "rel-1",
      flags,
    });
    expect(canUseFormalMailWithAccess(ctx, () => true)).toBe(true);
  });

  it("suspended participant", () => {
    const ctx = buildMessagingAccessContext({
      actorRole: "grossiste_b",
      organizationId: "org-b",
      relationshipId: "rel-1",
      participantStatus: "SUSPENDED",
      flags,
    });
    expect(isParticipantMessagingAllowed(ctx)).toBe(false);
  });
});
