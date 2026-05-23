import { describe, expect, it } from "vitest";

import { buildAccessContext, mergeAccessContext } from "./commerce-access-control-context";
import {
  commerceAccessUxMessage,
  decisionFromCode,
  sanitizeAccessErrorMessage,
} from "./commerce-access-control-errors";
import {
  isBackendAccessGuardEnabled,
  isCommerceAccessControlEnabled,
  isFormalActor,
  isTerrainActor,
  toGovRole,
} from "./commerce-access-control-governance";
import {
  assertCommerceAccess,
  guardBackendRoute,
  guardCommerceResource,
} from "./commerce-access-control-guards";
import {
  canConfirmDelivery,
  canConfirmSettlement,
  canCreateOrder,
  canUseFormalMail,
  canUseTerrainMessaging,
  canUseWallet,
  canViewActivityFeed,
  canViewDelivery,
  canViewNotifications,
  canViewOrder,
  canViewRelationalCatalog,
  canViewSettlement,
  canUseOfflineCache,
  evaluateCommercePermissions,
} from "./commerce-access-control-permissions";
import {
  assertNoUrlBypass,
  canSeeResource,
  isGlobalCatalogForbidden,
} from "./commerce-access-control-visibility";
import {
  backendGuardOrAllow,
  withActivityFeedAccess,
  withCatalogAccess,
  withOfflineCacheAccess,
} from "./commerce-access-integration";

const flagsOn = {
  commerce_access_control_enabled: true,
  commerce_visibility_guard_enabled: true,
  commerce_backend_access_guard_enabled: true,
  commercial_relationship_governance_enabled: true,
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
    flags: flagsOn,
    ...partial,
  });
}

describe("commerce-access-control (20.83)", () => {
  it("enables access control by default in dev flags", () => {
    expect(isCommerceAccessControlEnabled(flagsOn)).toBe(true);
    expect(isBackendAccessGuardEnabled(flagsOn)).toBe(true);
  });

  it("disables when flag off", () => {
    expect(isCommerceAccessControlEnabled({ commerce_access_control_enabled: false })).toBe(false);
  });

  it("maps actor roles to governance", () => {
    expect(toGovRole("PRODUCER")).toBe("producteur");
    expect(toGovRole("DETAILLANT")).toBe("detaillant");
  });

  it("formal vs terrain actors", () => {
    expect(isFormalActor("GROSSISTE_A")).toBe(true);
    expect(isTerrainActor("GROSSISTE_B")).toBe(true);
  });

  it("allows relational catalog with active relation", () => {
    expect(canViewRelationalCatalog(ctx())).toBe(true);
  });

  it("refuses global catalog", () => {
    expect(canViewRelationalCatalog(ctx({ catalogVisibility: "GLOBAL", relationshipId: undefined }))).toBe(false);
    expect(isGlobalCatalogForbidden(ctx({ catalogVisibility: "GLOBAL" }))).toBe(true);
  });

  it("refuses catalog without relation", () => {
    expect(canViewRelationalCatalog(ctx({ relationshipId: undefined, catalogVisibility: "HIDDEN" }))).toBe(false);
  });

  it("order visible for buyer seller", () => {
    expect(canViewOrder(ctx({ organizationId: "org-d", buyerOrganizationId: "org-d", sellerOrganizationId: "org-b" }))).toBe(true);
    expect(canViewOrder(ctx())).toBe(true);
  });

  it("order hidden for outsider", () => {
    expect(
      canViewOrder(
        ctx({
          organizationId: "org-outsider",
          buyerOrganizationId: "org-d",
          sellerOrganizationId: "org-b",
          relationshipId: undefined,
        }),
      ),
    ).toBe(false);
  });

  it("delivery linked to order", () => {
    expect(canViewDelivery(ctx())).toBe(true);
    expect(canConfirmDelivery(ctx())).toBe(true);
  });

  it("settlement for wallet owner", () => {
    expect(canViewSettlement(ctx())).toBe(true);
    expect(canConfirmSettlement(ctx())).toBe(true);
  });

  it("settlement refused non-owner", () => {
    expect(canViewSettlement(ctx({ organizationId: "org-x", walletOwnerOrganizationId: "org-b" }))).toBe(false);
  });

  it("wallet owner can use wallet online", () => {
    expect(canUseWallet(ctx())).toBe(true);
  });

  it("wallet blocked offline", () => {
    expect(canUseWallet(ctx({ connectivity: "OFFLINE", walletSecurityMode: "offline_wait" }))).toBe(false);
  });

  it("wallet non-owner refused", () => {
    expect(canUseWallet(ctx({ organizationId: "org-x", walletOwnerOrganizationId: "org-b" }))).toBe(false);
  });

  it("terrain messaging for grossiste B", () => {
    expect(canUseTerrainMessaging(ctx({ actorRole: "GROSSISTE_B", partnerRole: "DETAILLANT" }))).toBe(true);
  });

  it("formal mail for producer", () => {
    expect(
      canUseFormalMail(
        ctx({
          actorRole: "PRODUCER",
          partnerRole: "GROSSISTE_A",
          organizationId: "org-p",
        }),
      ),
    ).toBe(true);
  });

  it("mail not for pure terrain detaillant pair without mail gov", () => {
    const c = ctx({ actorRole: "DETAILLANT", partnerRole: "DETAILLANT", organizationId: "org-d" });
    expect(canUseFormalMail(c)).toBe(false);
  });

  it("notifications and activity feed with relation", () => {
    expect(canViewNotifications(ctx())).toBe(true);
    expect(canViewActivityFeed(ctx())).toBe(true);
  });

  it("offline cache allowed when relation ok", () => {
    expect(canUseOfflineCache(ctx())).toBe(true);
  });

  it("offline cache when offline but relation ok", () => {
    expect(canUseOfflineCache(ctx({ connectivity: "OFFLINE" }))).toBe(true);
  });

  it("offline cache denied without relation", () => {
    expect(
      canUseOfflineCache(
        ctx({ connectivity: "OFFLINE", relationshipId: undefined, catalogVisibility: "HIDDEN" }),
      ),
    ).toBe(false);
  });

  it("create order requires catalog and online", () => {
    expect(canCreateOrder(ctx())).toBe(true);
    expect(canCreateOrder(ctx({ connectivity: "OFFLINE" }))).toBe(false);
  });

  it("guard returns human catalog error", () => {
    const d = guardCommerceResource(ctx({ catalogVisibility: "GLOBAL" }), "relational_catalog");
    expect(d.allowed).toBe(false);
    expect(d.userMessage).toBe("Catalogue non disponible");
  });

  it("guard partner only on url bypass", () => {
    const d = guardCommerceResource(ctx(), "order", { requestedOrganizationId: "org-evil" });
    expect(d.allowed).toBe(false);
    expect(d.userMessage).toContain("partenaire");
  });

  it("assertNoUrlBypass blocks foreign org", () => {
    expect(assertNoUrlBypass(ctx(), "org-evil")).toBe(false);
    expect(assertNoUrlBypass(ctx(), "org-b")).toBe(true);
  });

  it("backend guard enabled", () => {
    const d = guardBackendRoute(ctx(), "notifications", "org-b");
    expect(d.allowed).toBe(true);
  });

  it("backend guard off skips", () => {
    const d = guardBackendRoute(
      ctx({ flags: { ...flagsOn, commerce_backend_access_guard_enabled: false } }),
      "order",
      "org-evil",
    );
    expect(d.allowed).toBe(true);
  });

  it("ux messages no forbidden jargon", () => {
    expect(commerceAccessUxMessage("order_not_accessible")).toBe("Commande non accessible");
    expect(sanitizeAccessErrorMessage("Access Denied")).not.toMatch(/denied/i);
  });

  it("decisionFromCode structure", () => {
    const d = decisionFromCode("relation_inactive");
    expect(d.allowed).toBe(false);
    expect(d.userMessage).toBe("Relation non active");
  });

  it("assertCommerceAccess throws human message", () => {
    expect(() =>
      assertCommerceAccess(ctx({ relationshipStatus: "REMOVED" }), "relational_catalog"),
    ).toThrow(/Relation non active|Catalogue/);
  });

  it("evaluateCommercePermissions returns all keys", () => {
    const p = evaluateCommercePermissions(ctx());
    expect(p.canViewRelationalCatalog).toBeDefined();
    expect(p.canAutoAcceptRelationship).toBeDefined();
  });

  it("canSeeResource delivery", () => {
    expect(canSeeResource(ctx(), "delivery")).toBe(true);
  });

  it("canSeeResource wallet owner only", () => {
    expect(canSeeResource(ctx(), "wallet")).toBe(true);
    expect(canSeeResource(ctx({ organizationId: "org-x", walletOwnerOrganizationId: "org-b" }), "wallet")).toBe(false);
  });

  it("hybrid grossiste A terrain mix messaging possible", () => {
    const c = ctx({ actorRole: "GROSSISTE_A", partnerRole: "GROSSISTE_B", organizationId: "org-ga" });
    expect(canUseFormalMail(c) || canUseTerrainMessaging(c)).toBe(true);
  });

  it("integration withCatalogAccess", () => {
    expect(withCatalogAccess(ctx(), () => true)).toBe(true);
    expect(withCatalogAccess(ctx({ catalogVisibility: "GLOBAL" }), () => true)).toBe(false);
  });

  it("integration notifications", () => {
    expect(withActivityFeedAccess(ctx(), () => true)).toBe(true);
  });

  it("integration offline cache secured", () => {
    expect(
      withOfflineCacheAccess(
        ctx({ catalogVisibility: "GLOBAL", relationshipId: undefined }),
        () => true,
      ),
    ).toBe(false);
  });

  it("backendGuardOrAllow", () => {
    expect(backendGuardOrAllow(ctx(), "notifications", "org-b").allowed).toBe(true);
  });

  it("mergeAccessContext", () => {
    const m = mergeAccessContext(ctx(), { connectivity: "OFFLINE" });
    expect(m.connectivity).toBe("OFFLINE");
  });

  it("no marketplace global visibility", () => {
    const d = guardCommerceResource(
      ctx({ catalogVisibility: "GLOBAL", relationshipId: "rel-x" }),
      "relational_catalog",
    );
    expect(d.errorCode).toBe("global_catalog_forbidden");
  });

  it("removed relation blocks catalog", () => {
    const d = guardCommerceResource(ctx({ relationshipStatus: "REMOVED" }), "relational_catalog");
    expect(d.allowed).toBe(false);
  });

  it("offline write blocked", () => {
    const d = guardCommerceResource(ctx({ connectivity: "OFFLINE" }), "order", { action: "write" });
    expect(d.userMessage).toContain("hors connexion");
  });

  it("producer structured permissions", () => {
    const p = evaluateCommercePermissions(
      ctx({ actorRole: "PRODUCER", organizationId: "org-p", partnerRole: "GROSSISTE_A" }),
    );
    expect(p.canViewRelationalCatalog || p.canUseFormalMail).toBe(true);
  });

  it("detaillant terrain messaging", () => {
    expect(
      canUseTerrainMessaging(
        ctx({ actorRole: "DETAILLANT", partnerRole: "GROSSISTE_B", organizationId: "org-d" }),
      ),
    ).toBe(true);
  });

  it("flags off allows guard pass", () => {
    const d = guardCommerceResource(
      ctx({ flags: { commerce_access_control_enabled: false } }),
      "relational_catalog",
    );
    expect(d.allowed).toBe(true);
  });

  it("partner profile with relationship", () => {
    expect(canSeeResource(ctx({ partnerOrganizationId: "org-d" }), "partner_profile")).toBe(true);
  });

  it("settlement guard message", () => {
    const d = guardCommerceResource(
      ctx({ organizationId: "org-x", walletOwnerOrganizationId: "org-b" }),
      "settlement",
    );
    expect(d.userMessage).toMatch(/Règlement|partenaire/);
  });

  it("messaging guard terrain", () => {
    const d = guardCommerceResource(
      ctx({ actorRole: "PRODUCER", partnerRole: "GROSSISTE_A", organizationId: "org-p" }),
      "messaging",
    );
    expect(d.allowed).toBe(false);
    expect(d.errorCode).toBe("messaging_not_allowed");
  });

  it("mail guard for terrain detaillant", () => {
    const d = guardCommerceResource(
      ctx({ actorRole: "DETAILLANT", partnerRole: "DETAILLANT", organizationId: "org-d" }),
      "mail",
    );
    expect(d.allowed).toBe(false);
  });

  it("auto accept contextual", () => {
    const p = evaluateCommercePermissions(
      ctx({ actorRole: "GROSSISTE_B", partnerRole: "GROSSISTE_B" }),
    );
    expect(typeof p.canAutoAcceptRelationship).toBe("boolean");
  });

  it("wallet locked mode", () => {
    expect(canUseWallet(ctx({ walletSecurityMode: "locked" }))).toBe(false);
  });

  it("no social permissions in evaluate", () => {
    const keys = Object.keys(evaluateCommercePermissions(ctx()));
    expect(keys.some((k) => k.includes("follow") || k.includes("like"))).toBe(false);
  });

  it("pending relation still allows read catalog in some cases", () => {
    expect(canViewRelationalCatalog(ctx({ relationshipStatus: "PENDING" }))).toBe(true);
  });

  it("suspended relation blocks via guard", () => {
    const d = guardCommerceResource(ctx({ relationshipStatus: "SUSPENDED" }), "order");
    expect(d.allowed).toBe(false);
  });

  it("degraded connectivity still reads notifications", () => {
    expect(canViewNotifications(ctx({ connectivity: "DEGRADED" }))).toBe(true);
  });
});
