import { describe, expect, it } from "vitest";

import {
  actorRoleToTranslationKey,
  createVenextI18n,
  isVenextLocale,
  loadTranslationDomain,
  preloadVenextDomains,
  resolveInitialLocale,
  VENEXT_LOCALES,
} from "./index";

describe("venext-i18n core (20.77)", () => {
  it("supports four locales", () => {
    expect(VENEXT_LOCALES).toEqual(["fr-CI", "en", "ar", "zh-CN"]);
  });

  it("isVenextLocale validates tags", () => {
    expect(isVenextLocale("fr-CI")).toBe(true);
    expect(isVenextLocale("xx")).toBe(false);
  });

  it("resolveInitialLocale returns a supported locale", () => {
    const loc = resolveInitialLocale();
    expect(VENEXT_LOCALES).toContain(loc);
  });

  it("resolveInitialLocale prefers explicit preferred", () => {
    expect(resolveInitialLocale("ar")).toBe("ar");
  });

  it("actorRoleToTranslationKey maps grossiste_b", () => {
    expect(actorRoleToTranslationKey("grossiste_b")).toBe("grossisteB");
  });

  it("loads fr common domain", async () => {
    const dict = await loadTranslationDomain("fr-CI", "common");
    expect(dict).toHaveProperty("app");
  });

  it("loads en orders domain", async () => {
    const dict = await loadTranslationDomain("en", "orders");
    expect((dict as { status?: { validated?: string } }).status?.validated).toBe("Validated");
  });

  it("loads ar wallet actor labels", async () => {
    const dict = await loadTranslationDomain("ar", "wallet");
    const actor = (dict as { actor?: { detaillant?: { balance?: { label?: string } } } }).actor;
    expect(actor?.detaillant?.balance?.label).toBeTruthy();
  });

  it("loads zh navigation tabs", async () => {
    const dict = await loadTranslationDomain("zh-CN", "navigation");
    expect((dict as { tabs?: { orders?: string } }).tabs?.orders).toBe("订单");
  });

  it("t resolves fr orders status after preload", async () => {
    await preloadVenextDomains("fr-CI", ["orders"]);
    const i18n = createVenextI18n({ locale: "fr-CI", isDev: false });
    expect(i18n.t("status.validated")).toBe("Validée");
  });

  it("tActor resolves producer wallet label", async () => {
    await preloadVenextDomains("en", ["wallet"]);
    const i18n = createVenextI18n({ locale: "en", isDev: false });
    expect(i18n.tActor("balance.label", { actorRole: "producteur" })).toBe("Partner balance");
  });

  it("tActor resolves detaillant payment label in fr", async () => {
    await preloadVenextDomains("fr-CI", ["wallet"]);
    const i18n = createVenextI18n({ locale: "fr-CI", isDev: false });
    expect(i18n.tActor("balance.label", { actorRole: "detaillant" })).toBe("Paiement");
  });

  it("tRelationship resolves formal communication", async () => {
    await preloadVenextDomains("fr-CI", ["relationship"]);
    const i18n = createVenextI18n({ locale: "fr-CI", isDev: false });
    expect(i18n.tRelationship("communication", { relationshipType: "formal" })).toMatch(/mail/i);
  });

  it("tRelationship resolves terrain communication", async () => {
    await preloadVenextDomains("en", ["relationship"]);
    const i18n = createVenextI18n({ locale: "en", isDev: false });
    expect(i18n.tRelationship("communication", { relationshipType: "terrain" })).toMatch(/messaging/i);
  });

  it("fallback to fr-CI when key missing in en", async () => {
    await preloadVenextDomains("fr-CI", ["errors"]);
    await preloadVenextDomains("en", ["common"]);
    const i18n = createVenextI18n({ locale: "en", isDev: false });
    expect(i18n.t("generic")).toMatch(/wrong|souci|error|حدث/i);
  });

  it("prod missing key returns ellipsis not bracket", async () => {
    const i18n = createVenextI18n({ locale: "en", isDev: false });
    expect(i18n.t("nonexistent.deep.key")).toBe("…");
  });

  it("dev missing key shows bracket", async () => {
    const i18n = createVenextI18n({ locale: "en", isDev: true });
    expect(i18n.t("nonexistent.deep.key")).toBe("[nonexistent.deep.key]");
  });

  it("interpolates params via app name", async () => {
    await preloadVenextDomains("en", ["common"]);
    const i18n = createVenextI18n({ locale: "en", isDev: false });
    expect(i18n.t("app.name")).toBe("VENEXT");
  });

  it("lazy domain load caches second call", async () => {
    const a = await loadTranslationDomain("fr-CI", "catalog");
    const b = await loadTranslationDomain("fr-CI", "catalog");
    expect(a).toBe(b);
  });

  it("grossiste A actor navigation key", async () => {
    await preloadVenextDomains("fr-CI", ["navigation"]);
    const i18n = createVenextI18n({ locale: "fr-CI", isDev: false });
    expect(i18n.t("actor.grossisteA.workspace.orders")).toBe("Commandes");
  });

  it("hybrid relationship label", async () => {
    await preloadVenextDomains("ar", ["relationship"]);
    const i18n = createVenextI18n({ locale: "ar", isDev: false });
    expect(i18n.tRelationship("label", { relationshipType: "hybrid" })).toBeTruthy();
  });

  it("grossiste B terrain wallet label", async () => {
    await preloadVenextDomains("fr-CI", ["wallet"]);
    const i18n = createVenextI18n({ locale: "fr-CI", isDev: false });
    expect(i18n.tActor("balance.label", { actorRole: "grossiste_b" })).toBe("Règlement terrain");
  });
});
