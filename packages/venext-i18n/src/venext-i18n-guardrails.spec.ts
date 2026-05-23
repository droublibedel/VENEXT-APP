import { describe, expect, it } from "vitest";

import { sanitizeTranslatedCommerceText } from "commerce-foundation-guardrails";

import { guardTranslationOutput } from "./venext-translation-guard";

describe("venext i18n guardrails (20.77)", () => {
  it("sanitizeTranslatedCommerceText strips ERP in en", () => {
    const out = sanitizeTranslatedCommerceText("ERP dashboard workflow", "en");
    expect(out.toLowerCase()).not.toMatch(/\berp\b/);
  });

  it("sanitizeTranslatedCommerceText strips fintech in fr", () => {
    const out = sanitizeTranslatedCommerceText("fintech banking", "fr-CI");
    expect(out.toLowerCase()).not.toMatch(/fintech/);
  });

  it("sanitizeTranslatedCommerceText strips social network in ar", () => {
    const out = sanitizeTranslatedCommerceText("social network feed", "ar");
    expect(out).not.toMatch(/social network/i);
  });

  it("sanitizeTranslatedCommerceText strips marketplace in zh", () => {
    const out = sanitizeTranslatedCommerceText("public marketplace", "zh-CN");
    expect(out).not.toMatch(/marketplace/i);
  });

  it("sanitizeTranslatedCommerceText strips supply chain", () => {
    const out = sanitizeTranslatedCommerceText("supply chain operations", "en");
    expect(out.toLowerCase()).not.toMatch(/supply chain/);
  });

  it("sanitizeTranslatedCommerceText strips chatbot", () => {
    const out = sanitizeTranslatedCommerceText("AI chatbot assistant", "en");
    expect(out.toLowerCase()).not.toMatch(/chatbot/);
  });

  it("sanitizeTranslatedCommerceText strips scoring", () => {
    const out = sanitizeTranslatedCommerceText("partner scoring", "en");
    expect(out.toLowerCase()).not.toMatch(/scoring/);
  });

  it("guardTranslationOutput respects disabled guardrails flag", () => {
    const raw = "ERP workflow";
    expect(
      guardTranslationOutput(raw, "en", { venext_multilingual_guardrails_enabled: false }),
    ).toBe(raw);
  });

  it("guardTranslationOutput applies when enabled", () => {
    const out = guardTranslationOutput("ERP workflow", "en", {
      venext_multilingual_guardrails_enabled: true,
    });
    expect(out.toLowerCase()).not.toMatch(/\berp\b/);
  });
});
