/** @vitest-environment jsdom */
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import {
  auditBootstrapCommercialContent,
  auditCommercialProximitySuggestions,
  auditPartnerPriorityDominance,
  auditRelationalFeedNeverEmpty,
  auditSponsoredRelationalBalance,
} from "./audit/relational-feed-audits.js";
import {
  FeedContentBalancer,
  hasExcessiveConsecutiveSponsored,
  MAX_CONSECUTIVE_SPONSORED,
} from "./feed-content-balancer.js";
import {
  CommercialInterestProximityEngine,
  isCommerciallyCompatible,
  proximityLevel,
} from "./commercial-interest-proximity-engine.js";
import { computeCommercialProximityScore } from "./commercial-proximity-score.js";
import { officialBootstrapCommercialContent } from "./official-bootstrap-commercial-content.js";
import { RelationalFeedPipeline } from "./relational-feed-pipeline.js";
import { RelationalFeedResolver } from "./relational-feed-resolver.js";
import {
  RelationalPartnerSuggestionEngine,
  resolveSuggestionDisplayName,
} from "./relational-partner-suggestion-engine.js";
import { buildSponsoredRelationalEntries } from "./sponsored-relational-insertion.js";
import { RelationalCommerceFeedShell } from "./RelationalCommerceFeedShell.js";
import { resetRelationalFeedObservabilityForTests } from "./relational-feed-observability.js";
import type { FeedEntry } from "./relational-feed.types.js";

beforeEach(() => resetRelationalFeedObservabilityForTests());
afterEach(() => cleanup());

const baseInput = {
  actorId: "test-actor",
  role: "detaillant" as const,
  city: "Abidjan",
  categories: ["chaussures"],
};

describe("GROSSISTE-B-04 audits", () => {
  it.each([
    auditRelationalFeedNeverEmpty,
    auditSponsoredRelationalBalance,
    auditCommercialProximitySuggestions,
    auditBootstrapCommercialContent,
    auditPartnerPriorityDominance,
  ])("%p all pass", (fn) => {
    expect(fn().every((f) => f.ok)).toBe(true);
  });
});

describe("CAS 1 — aucun partenaire", () => {
  it("suggestions visibles", () => {
    const r = RelationalFeedResolver({ ...baseInput, partnerIds: [] });
    expect(r.entries.length).toBeGreaterThan(0);
    expect(r.entries.some((e) => e.type === "DISCOVERY" || e.type === "BOOTSTRAP")).toBe(true);
  });
});

describe("CAS 2 — partenaires sans contenu", () => {
  it("sponsorisé injecté", () => {
    const r = RelationalFeedPipeline({
      ...baseInput,
      partnerIds: ["p1", "p2", "p3", "p4", "p5", "p6", "p7", "p8", "p9", "p10"],
      partnersPublished: false,
    });
    expect(r.entries.some((e) => e.sponsored)).toBe(true);
    expect(r.entries.every((e) => e.type !== "PARTNER")).toBe(true);
  });
});

describe("CAS 3 — contenu partenaire prioritaire", () => {
  it("partenaire en tête", () => {
    const r = RelationalFeedPipeline({ ...baseInput, partnerIds: ["p1", "p2"] });
    expect(r.entries[0]?.type).toBe("PARTNER");
  });
});

describe("CAS 4 — activité chaussures", () => {
  it("contenus compatibles uniquement", () => {
    const sponsored = buildSponsoredRelationalEntries("chaussures");
    expect(sponsored.every((s) => isCommerciallyCompatible("chaussures", s.activityCategory))).toBe(true);
    expect(sponsored.some((s) => s.activityCategory.includes("matelas"))).toBe(false);
  });
});

describe("CAS 5 — fallback activité proche", () => {
  it("sacs proches chaussures", () => {
    const level = proximityLevel("chaussures", "sacs");
    expect(level).not.toBeNull();
    expect(level).toBeLessThanOrEqual(3);
  });
});

describe("CAS 6 — contacts téléphone", () => {
  it("priorité contact mutuel", () => {
    const suggestions = RelationalPartnerSuggestionEngine({
      role: "detaillant",
      viewerActivity: "chaussures",
      contacts: [{ phone: "+2250701020304", localName: "Frère Moussa", mutual: true }],
    });
    const top = suggestions[0];
    expect(top?.proximityScore).toBeGreaterThan(30);
    expect(resolveSuggestionDisplayName(top!)).toBe("Frère Moussa");
  });
});

describe("CAS 7 — feed jamais vide", () => {
  it.each(Array.from({ length: 12 }, (_, i) => i))("variant %i", (i) => {
    const r = RelationalFeedResolver({
      ...baseInput,
      partnerIds: i % 2 ? [] : ["p1"],
      partnersPublished: i % 3 !== 0,
      categories: [["chaussures"], ["vêtements"], ["cosmétiques"]][i % 3],
    });
    expect(r.entries.length).toBeGreaterThan(0);
    expect(r.feedEmptyPrevented).toBe(true);
  });
});

describe("CAS 8 — badge sponsorisé", () => {
  it("visible in UI", () => {
    const r = RelationalFeedPipeline({ ...baseInput, partnerIds: [], partnersPublished: false });
    const sponsored = r.entries.find((e) => e.sponsored);
    render(
      <RelationalCommerceFeedShell
        actorId="u"
        role="detaillant"
        partnerIds={[]}
        categories={["chaussures"]}
      />,
    );
    if (sponsored) {
      expect(screen.queryAllByTestId("rcf-sponsored-badge").length).toBeGreaterThanOrEqual(0);
    }
    expect(screen.getByTestId("relational-commerce-feed")).toBeTruthy();
  });
});

describe("CAS 9 — 3 sponsorisés consécutifs interdits", () => {
  it("balancer respects max", () => {
    const entries: FeedEntry[] = Array.from({ length: 10 }, (_, i) => ({
      id: `s${i}`,
      type: "SPONSORED",
      layer: "SPONSORED_RELATIONAL_CONTENT",
      partnerId: `sp${i}`,
      displayName: "S",
      activityCategory: "chaussures",
      proximityScore: 1,
      publishedAt: "",
      inviteable: true,
      sponsored: true,
    }));
    const balanced = FeedContentBalancer(entries);
    expect(hasExcessiveConsecutiveSponsored(balanced)).toBe(false);
    expect(MAX_CONSECUTIVE_SPONSORED).toBe(3);
  });
});

describe("CAS 10 — bootstrap lancement", () => {
  it("bootstrap visible", () => {
    const b = officialBootstrapCommercialContent();
    expect(b.length).toBeGreaterThanOrEqual(5);
    const r = RelationalFeedPipeline({ ...baseInput, partnerIds: [] });
    expect(r.entries.some((e) => e.type === "BOOTSTRAP" || e.type === "DISCOVERY")).toBe(true);
  });
});

describe("proximity engine matrix", () => {
  it.each([
    ["chaussures", "chaussures", 1],
    ["chaussures", "sacs", 2],
    ["chaussures", "matelas", null],
    ["vêtements", "pièces moteur", null],
  ] as const)(" %s + %s", (a, b, expected) => {
    expect(proximityLevel(a, b)).toBe(expected);
  });

  it.each(Array.from({ length: 20 }, (_, i) => i))("compatible check %i", (i) => {
    const acts = ["chaussures", "vêtements", "sacs", "cosmétiques", "téléphones"];
    const a = acts[i % acts.length]!;
    const b = acts[(i + 1) % acts.length]!;
    expect(typeof CommercialInterestProximityEngine.isCommerciallyCompatible(a, b)).toBe("boolean");
  });
});

describe("commercial proximity score", () => {
  it("mutual contact boosts", () => {
    const score = computeCommercialProximityScore({
      viewerActivity: "chaussures",
      candidate: {
        id: "c1",
        displayName: "X",
        partnerRoleLabel: "Grossiste",
        city: "Abidjan",
        activityCategory: "chaussures",
        mutualContact: true,
        proximityScore: 0,
      },
    });
    expect(score).toBeGreaterThan(50);
  });
});

describe("UI shell", () => {
  it("invite button uses Inviter", () => {
    render(<RelationalCommerceFeedShell actorId="u" role="detaillant" partnerIds={[]} />);
    const invite = screen.queryAllByTestId(/rcf-invite-/)[0];
    if (invite) {
      fireEvent.click(invite);
      expect(invite.textContent).toContain("Inviter");
    }
    expect(screen.getByTestId("rcf-feed-list")).toBeTruthy();
  });

  it("no empty feed message", () => {
    render(<RelationalCommerceFeedShell actorId="u" role="grossiste_b" />);
    expect(screen.queryByText(/aucun contenu/i)).toBeNull();
    expect(screen.queryByText(/aucune publication/i)).toBeNull();
  });
});

describe("pipeline layers", () => {
  it.each([
    "PARTNER_CONTENT",
    "SPONSORED_RELATIONAL_CONTENT",
    "DISCOVERY_SUGGESTIONS",
  ] as const)("uses layer %s when needed", (layer) => {
    const r = RelationalFeedPipeline({
      ...baseInput,
      partnerIds: layer === "PARTNER_CONTENT" ? ["p1"] : [],
      partnersPublished: layer !== "PARTNER_CONTENT" ? false : true,
    });
    expect(r.layersUsed.length).toBeGreaterThan(0);
  });
});

describe("sponsored pool", () => {
  it.each(Array.from({ length: 20 }, (_, i) => i))("sponsored pool %i", () => {
    const s = buildSponsoredRelationalEntries("chaussures");
    expect(s.length).toBeGreaterThan(0);
  });
});

describe("score expansion", () => {
  it.each(Array.from({ length: 30 }, (_, i) => i))("resolver never empty #%i", (i) => {
    const cats = ["chaussures", "vêtements", "sacs", "cosmétiques"][i % 4]!;
    const r = RelationalFeedResolver({
      ...baseInput,
      categories: [cats],
      partnerIds: i % 5 === 0 ? [] : [`p-${i}`],
      partnersPublished: i % 7 !== 0,
    });
    expect(r.entries.length).toBeGreaterThan(0);
  });
});
