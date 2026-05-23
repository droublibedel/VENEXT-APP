import { describe, expect, it } from "vitest";

import {
  classifyAcceptanceSignal,
  draftAnchorsClearedFromReject,
  extractQuantity,
  makeEmptyDraft,
  reduceDraftWithMessage,
} from "./conversational-order-draft.engine";

const thread = (over: Partial<{ productId: string | null }> = {}) => ({
  productId: "61111111-1111-4111-8111-111111111001" as string | null,
  buyerOrganizationId: "11111111-1111-4111-8111-111111111111",
  sellerOrganizationId: "22222222-2222-4222-8222-222222222222",
  relationshipId: "71111111-1111-4111-8111-111111111111" as string | null,
  ...over,
});

describe("Instruction 20.1A — conversational order draft engine", () => {
  it("extracts quantity with unit", () => {
    expect(extractQuantity("Je peux faire 300 cartons avant vendredi")).toEqual({ value: 300, unit: "cartons" });
  });

  it("classifies strong vs weak vs ambiguous", () => {
    expect(classifyAcceptanceSignal("OK")).toBe("STRONG_CONFIRMATION");
    expect(classifyAcceptanceSignal("d'accord pour ça")).toBe("STRONG_CONFIRMATION");
    expect(classifyAcceptanceSignal("j'ai compris")).toBe("WEAK_ACKNOWLEDGEMENT");
    expect(classifyAcceptanceSignal("oui")).toBe("AMBIGUOUS_ACCEPTANCE");
  });

  it("chains proposal then strong OK from counterparty updates draft to DRAFT_READY", () => {
    let d = makeEmptyDraft();
    const sellerMsg = {
      id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
      senderOrganizationId: "11111111-1111-4111-8111-111111111111",
      messageType: "TEXT",
      content: "Je peux faire 300 cartons avant vendredi à 405000 fcfa",
      createdAt: new Date("2026-05-01T10:00:00Z"),
    };
    d = reduceDraftWithMessage({
      draft: d,
      messagesAsc: [sellerMsg],
      latest: sellerMsg,
      thread: thread(),
    });
    expect(d.workingTerms.quantity).toBe(300);
    expect(d.lastProposalOrganizationId).toBe(sellerMsg.senderOrganizationId);

    const buyerOk = {
      id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
      senderOrganizationId: "22222222-2222-4222-8222-222222222222",
      messageType: "TEXT",
      content: "OK",
      createdAt: new Date("2026-05-01T10:02:00Z"),
    };
    d = reduceDraftWithMessage({
      draft: d,
      messagesAsc: [sellerMsg, buyerOk],
      latest: buyerOk,
      thread: thread(),
    });
    expect(d.negotiationState).toBe("DRAFT_READY");
    expect(d.requiresHumanValidation).toBe(true);
  });

  it("ambiguous oui alone does not promote to DRAFT_READY", () => {
    let d = makeEmptyDraft();
    const sellerMsg = {
      id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
      senderOrganizationId: "11111111-1111-4111-8111-111111111111",
      messageType: "TEXT",
      content: "300 cartons à 405000 fcfa",
      createdAt: new Date("2026-05-01T10:00:00Z"),
    };
    d = reduceDraftWithMessage({ draft: d, messagesAsc: [sellerMsg], latest: sellerMsg, thread: thread() });
    const buyerWeak = {
      id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
      senderOrganizationId: "22222222-2222-4222-8222-222222222222",
      messageType: "TEXT",
      content: "oui",
      createdAt: new Date("2026-05-01T10:02:00Z"),
    };
    d = reduceDraftWithMessage({
      draft: d,
      messagesAsc: [sellerMsg, buyerWeak],
      latest: buyerWeak,
      thread: thread(),
    });
    expect(d.negotiationState).not.toBe("DRAFT_READY");
    expect(d.lastConfirmationSignal).toBe("AMBIGUOUS_ACCEPTANCE");
  });

  it("OK does not accept own proposal", () => {
    let d = makeEmptyDraft();
    const a = {
      id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
      senderOrganizationId: "11111111-1111-4111-8111-111111111111",
      messageType: "TEXT",
      content: "300 cartons à 405000 fcfa",
      createdAt: new Date("2026-05-01T10:00:00Z"),
    };
    d = reduceDraftWithMessage({ draft: d, messagesAsc: [a], latest: a, thread: thread() });
    const selfOk = {
      id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
      senderOrganizationId: "11111111-1111-4111-8111-111111111111",
      messageType: "TEXT",
      content: "OK",
      createdAt: new Date("2026-05-01T10:02:00Z"),
    };
    d = reduceDraftWithMessage({
      draft: d,
      messagesAsc: [a, selfOk],
      latest: selfOk,
      thread: thread(),
    });
    expect(d.negotiationState).not.toBe("DRAFT_READY");
  });

  it("rejection clears anchors so later OK does not revive stale proposal", () => {
    let d = makeEmptyDraft();
    const sellerProposal = {
      id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
      senderOrganizationId: "11111111-1111-4111-8111-111111111111",
      messageType: "TEXT",
      content: "300 cartons à 405000 fcfa",
      createdAt: new Date("2026-05-01T10:00:00Z"),
    };
    d = reduceDraftWithMessage({
      draft: d,
      messagesAsc: [sellerProposal],
      latest: sellerProposal,
      thread: thread(),
    });
    const buyerReject = {
      id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
      senderOrganizationId: "22222222-2222-4222-8222-222222222222",
      messageType: "TEXT",
      content: "non trop cher",
      createdAt: new Date("2026-05-01T10:01:00Z"),
    };
    d = reduceDraftWithMessage({
      draft: d,
      messagesAsc: [sellerProposal, buyerReject],
      latest: buyerReject,
      thread: thread(),
    });
    expect(d.lastProposalMessageId).toBeNull();
    const buyerOk = {
      id: "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
      senderOrganizationId: "22222222-2222-4222-8222-222222222222",
      messageType: "TEXT",
      content: "OK",
      createdAt: new Date("2026-05-01T10:02:00Z"),
    };
    d = reduceDraftWithMessage({
      draft: d,
      messagesAsc: [sellerProposal, buyerReject, buyerOk],
      latest: buyerOk,
      thread: thread(),
    });
    expect(d.negotiationState).not.toBe("DRAFT_READY");
  });

  it("draftAnchorsClearedFromReject preserves draftId and audit tail", () => {
    const prev = makeEmptyDraft();
    const cleared = draftAnchorsClearedFromReject(prev, "22222222-2222-4222-8222-222222222222");
    expect(cleared.draftId).toBe(prev.draftId);
    expect(cleared.lastProposalMessageId).toBeNull();
    expect(cleared.negotiationState).toBe("DRAFT_REJECTED");
    expect(cleared.conversionStatus).toBe("DRAFT_REJECTED");
  });
});
