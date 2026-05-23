import { describe, expect, it } from "vitest";

import { buildAccessContext } from "./commerce-access-control-context";
import { commerceAccessUxMessage } from "./commerce-access-control-errors";
import { guardBackendRoute } from "./commerce-access-control-guards";
import {
  assertCatalogAction,
  assertMessagingAction,
  assertOfflineReplay,
  assertOrderAction,
  assertWalletAction,
  guardCatalogAction,
  guardMessagingAction,
  guardOfflineReplay,
  guardOrderAction,
  guardWalletAction,
} from "./commerce-surface-access";
import {
  withCatalogActionAccess,
  withFormalMailAccess,
  withOrderActionAccess,
  withQuickOrderAccess,
  withTerrainMessagingAccess,
  withWalletActionAccess,
} from "./commerce-access-integration";

const flagsOn = {
  commerce_access_control_enabled: true,
  commerce_visibility_guard_enabled: true,
  commerce_backend_access_guard_enabled: true,
};

function ctx(partial: Parameters<typeof buildAccessContext>[0] = {}) {
  return buildAccessContext({
    actorRole: "GROSSISTE_B",
    organizationId: "org-b",
    relationshipId: "rel-1",
    relationshipStatus: "ACTIVE",
    buyerOrganizationId: "org-d",
    sellerOrganizationId: "org-b",
    walletOwnerOrganizationId: "org-b",
    catalogVisibility: "RELATION_ONLY",
    flags: flagsOn,
    ...partial,
  });
}

describe("commerce-access-control 20.83-A surfaces", () => {
  describe("CATALOG", () => {
    it("view catalog allowed", () => {
      expect(guardCatalogAction(ctx(), "view").allowed).toBe(true);
    });
    it("browse catalog allowed", () => {
      expect(guardCatalogAction(ctx(), "browse").allowed).toBe(true);
    });
    it("hidden catalog blocked", () => {
      expect(guardCatalogAction(ctx({ catalogVisibility: "HIDDEN" }), "view").allowed).toBe(false);
    });
    it("hidden action blocked", () => {
      expect(guardCatalogAction(ctx(), "hidden").allowed).toBe(false);
    });
    it("inactive relation blocked", () => {
      expect(guardCatalogAction(ctx({ relationshipStatus: "REMOVED" }), "view").allowed).toBe(false);
    });
    it("sponsored requires visibility", () => {
      expect(guardCatalogAction(ctx({ catalogVisibility: "RELATION_ONLY" }), "sponsored").allowed).toBe(
        false,
      );
    });
    it("sponsored allowed when visibility matches", () => {
      expect(guardCatalogAction(ctx({ catalogVisibility: "SPONSORED" }), "sponsored").allowed).toBe(
        true,
      );
    });
    it("partner_only without relation", () => {
      expect(guardCatalogAction(ctx({ relationshipId: undefined }), "partner_only").allowed).toBe(
        false,
      );
    });
    it("quick order write", () => {
      expect(guardCatalogAction(ctx(), "quick_order").allowed).toBe(true);
    });
    it("url bypass blocked", () => {
      expect(
        guardCatalogAction(ctx(), "view", { requestedOrganizationId: "org-other" }).allowed,
      ).toBe(false);
    });
    it("withCatalogActionAccess browse", () => {
      expect(withCatalogActionAccess(ctx(), "browse", () => true)).toBe(true);
    });
    it("withQuickOrderAccess", () => {
      expect(withQuickOrderAccess(ctx(), () => true)).toBe(true);
    });
    it("assertCatalogAction throws human", () => {
      expect(() => assertCatalogAction(ctx({ catalogVisibility: "HIDDEN" }), "view")).toThrow(
        commerceAccessUxMessage("catalog_unavailable"),
      );
    });
  });

  describe("ORDERS", () => {
    it("owner read", () => {
      expect(guardOrderAction(ctx(), "read").allowed).toBe(true);
    });
    it("create order", () => {
      expect(guardOrderAction(ctx(), "create").allowed).toBe(true);
    });
    it("track order", () => {
      expect(withOrderActionAccess(ctx(), "track", () => true)).toBe(true);
    });
    it("cross org blocked", () => {
      expect(guardOrderAction(ctx(), "read", { requestedOrganizationId: "org-x" }).allowed).toBe(
        false,
      );
    });
    it("inactive relation", () => {
      expect(guardOrderAction(ctx({ relationshipStatus: "SUSPENDED" }), "read").allowed).toBe(
        false,
      );
    });
    it("delivery linked", () => {
      expect(guardOrderAction(ctx(), "delivery").allowed).toBe(true);
    });
    it("settlement linked", () => {
      expect(guardOrderAction(ctx(), "settlement").allowed).toBe(true);
    });
    it("outsider not party", () => {
      expect(
        guardOrderAction(
          ctx({
            organizationId: "org-x",
            buyerOrganizationId: "org-a",
            sellerOrganizationId: "org-b",
            relationshipId: undefined,
          }),
          "read",
        ).allowed,
      ).toBe(false);
    });
    it("assertOrderAction", () => {
      expect(() =>
        assertOrderAction(
          ctx({
            organizationId: "org-x",
            buyerOrganizationId: "org-a",
            sellerOrganizationId: "org-b",
            relationshipId: undefined,
          }),
          "read",
        ),
      ).toThrow(commerceAccessUxMessage("order_not_accessible"));
    });
    it("offline create blocked", () => {
      expect(guardOrderAction(ctx({ connectivity: "OFFLINE" }), "create").allowed).toBe(false);
    });
  });

  describe("WALLET", () => {
    it("owner access", () => {
      expect(guardWalletAction(ctx(), "access").allowed).toBe(true);
    });
    it("cross org blocked", () => {
      expect(
        guardWalletAction(ctx({ organizationId: "org-x", walletOwnerOrganizationId: "org-b" }), "access")
          .allowed,
      ).toBe(false);
    });
    it("secured locked", () => {
      expect(
        guardWalletAction(ctx({ walletSecurityMode: "locked" }), "secured").allowed,
      ).toBe(false);
    });
    it("offline settlement forbidden", () => {
      expect(guardWalletAction(ctx({ connectivity: "OFFLINE" }), "settlement").allowed).toBe(false);
    });
    it("inactive relation settlement", () => {
      expect(guardWalletAction(ctx({ relationshipStatus: "REMOVED" }), "settlement").allowed).toBe(
        false,
      );
    });
    it("history read offline owner", () => {
      expect(
        guardWalletAction(
          ctx({ connectivity: "OFFLINE", flags: { ...flagsOn, commerce_visibility_guard_enabled: false } }),
          "history",
        ).allowed,
      ).toBe(true);
    });
    it("withWalletActionAccess settlement", () => {
      expect(withWalletActionAccess(ctx(), "settlement", () => true)).toBe(true);
    });
    it("assertWalletAction", () => {
      expect(() =>
        assertWalletAction(ctx({ organizationId: "org-x", walletOwnerOrganizationId: "org-b" }), "access"),
      ).toThrow(commerceAccessUxMessage("wallet_not_owner"));
    });
    it("activation owner", () => {
      expect(guardWalletAction(ctx(), "activation").allowed).toBe(true);
    });
  });

  describe("MESSAGING", () => {
    it("terrain grossiste b", () => {
      expect(guardMessagingAction(ctx(), "terrain").allowed).toBe(true);
    });
    it("terrain blocked for formal actor", () => {
      expect(guardMessagingAction(ctx({ actorRole: "PRODUCER" }), "terrain").allowed).toBe(false);
    });
    it("formal mail producteur", () => {
      expect(guardMessagingAction(ctx({ actorRole: "PRODUCER" }), "formal").allowed).toBe(true);
    });
    it("suspended participant", () => {
      expect(
        guardMessagingAction(ctx({ participantStatus: "SUSPENDED" }), "terrain").allowed,
      ).toBe(false);
    });
    it("inactive relation", () => {
      expect(guardMessagingAction(ctx({ relationshipStatus: "REMOVED" }), "terrain").allowed).toBe(
        false,
      );
    });
    it("withTerrainMessagingAccess", () => {
      expect(withTerrainMessagingAccess(ctx(), () => true)).toBe(true);
    });
    it("withFormalMailAccess", () => {
      expect(withFormalMailAccess(ctx({ actorRole: "GROSSISTE_A" }), () => true)).toBe(true);
    });
    it("assertMessagingAction suspended", () => {
      expect(() =>
        assertMessagingAction(ctx({ participantStatus: "SUSPENDED" }), "terrain"),
      ).toThrow(commerceAccessUxMessage("messaging_participant_suspended"));
    });
    it("terrain vs formal separation", () => {
      expect(guardMessagingAction(ctx({ actorRole: "DETAILLANT" }), "formal").allowed).toBe(false);
    });
  });

  describe("OFFLINE", () => {
    it("replay blocked when relation removed", () => {
      expect(guardOfflineReplay(ctx({ relationshipStatus: "REMOVED" })).allowed).toBe(false);
    });
    it("replay allowed active", () => {
      expect(guardOfflineReplay(ctx()).allowed).toBe(true);
    });
    it("assertOfflineReplay", () => {
      expect(() => assertOfflineReplay(ctx({ relationshipStatus: "SUSPENDED" }))).toThrow(
        commerceAccessUxMessage("relation_inactive"),
      );
    });
  });

  describe("UX messages", () => {
    it("no forbidden jargon", () => {
      expect(commerceAccessUxMessage("partner_only")).not.toMatch(/forbidden/i);
    });
    it("wallet message human", () => {
      expect(commerceAccessUxMessage("wallet_not_owner")).toContain("espace");
    });
  });

  describe("flags off passthrough", () => {
    it("catalog when disabled", () => {
      expect(
        guardCatalogAction(ctx({ flags: { commerce_access_control_enabled: false } }), "hidden")
          .allowed,
      ).toBe(true);
    });
  });

  describe("BFF guardBackendRoute", () => {
    it("catalog route needs relation", () => {
      expect(guardBackendRoute(ctx({ relationshipId: undefined }), "relational_catalog", "org-b").allowed).toBe(
        false,
      );
    });
    it("catalog route with relation", () => {
      expect(guardBackendRoute(ctx(), "relational_catalog", "org-b").allowed).toBe(true);
    });
    it("wallet route owner", () => {
      expect(guardBackendRoute(ctx(), "wallet", "org-b").allowed).toBe(true);
    });
    it("wallet route foreign org", () => {
      expect(guardBackendRoute(ctx(), "wallet", "org-x").allowed).toBe(false);
    });
    it("messaging inactive", () => {
      expect(
        guardBackendRoute(ctx({ relationshipStatus: "SUSPENDED" }), "messaging", "org-b").allowed,
      ).toBe(false);
    });
    it("mail formal producer", () => {
      expect(
        guardBackendRoute(
          ctx({ actorRole: "PRODUCER", organizationId: "org-p", relationshipId: "rel-1" }),
          "mail",
          "org-p",
        ).allowed,
      ).toBe(true);
    });
    it("offline cache inactive", () => {
      expect(
        guardBackendRoute(ctx({ relationshipStatus: "REMOVED" }), "offline_cache", "org-b").allowed,
      ).toBe(false);
    });
  });

  describe("visibility matrix", () => {
    it("partner approved visibility", () => {
      expect(guardCatalogAction(ctx({ catalogVisibility: "PARTNER_APPROVED" }), "view").allowed).toBe(
        true,
      );
    });
    it("global catalog forbidden", () => {
      expect(guardCatalogAction(ctx({ catalogVisibility: "GLOBAL" }), "view").allowed).toBe(false);
    });
    it("visibility action", () => {
      expect(guardCatalogAction(ctx(), "visibility").allowed).toBe(true);
    });
    it("order track inactive", () => {
      expect(guardOrderAction(ctx({ relationshipStatus: "REMOVED" }), "track").allowed).toBe(false);
    });
    it("wallet secured standard", () => {
      expect(guardWalletAction(ctx({ walletSecurityMode: "standard" }), "secured").allowed).toBe(true);
    });
    it("messaging participant check", () => {
      expect(guardMessagingAction(ctx(), "participant").allowed).toBe(true);
    });
  });
});
