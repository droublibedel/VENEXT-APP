/**
 * Instruction 20.1 — heuristic conversational extraction (private thread, not ERP).
 * Instruction 20.1A — hardened acceptance signals + anchor cleanup on rejection.
 */
import { randomUUID } from "node:crypto";

import type {
  ConversationalConfirmationSignal,
  ConversationalDraftRevision,
  ConversationalOrderDraftEnvelope,
  RelationalNegotiationConversationState,
} from "@venext/shared-contracts";
import { ConversationalOrderDraftEnvelopeSchema } from "@venext/shared-contracts";

const STRONG_ACCEPT_RE =
  /\b(ok|okay|okk|d'accord|dacord|c'est bon|cest bon|validé|valide|ça marche|ca marche|entendu|on fait comme ça|parfait|confirmé|confirme)\b/i;

const REJECT_RE =
  /\b(non|nan|pas possible|refus|refuse|trop cher|impossible|annul|annule|stop|nope)\b/i;

const RESERVE_RE = /\b(garde|garder|réserve|réserver|réserve-moi|reserve|hold)\b/i;

const UNIT_RE = /\b(cartons?|caisses?|unités?|pcs?|pièces?|sacs?|palette?s?|kg|tonnes?)\b/i;

export type ThreadDraftContext = {
  productId: string | null;
  buyerOrganizationId: string | null;
  sellerOrganizationId: string | null;
  relationshipId: string | null;
};

function mergeDraftFromStorage(raw: unknown): ConversationalOrderDraftEnvelope {
  const base = makeEmptyDraft();
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return base;
  const o = raw as Record<string, unknown>;
  const wt =
    typeof o.workingTerms === "object" && o.workingTerms !== null && !Array.isArray(o.workingTerms)
      ? (o.workingTerms as Record<string, unknown>)
      : {};
  const merged: Record<string, unknown> = {
    ...base,
    ...o,
    workingTerms: { ...base.workingTerms, ...wt },
    revisionHistory: Array.isArray(o.revisionHistory) ? o.revisionHistory : base.revisionHistory,
  };
  const r = ConversationalOrderDraftEnvelopeSchema.safeParse(merged);
  return r.success ? r.data : base;
}

export function parseDraftFromJson(raw: unknown): ConversationalOrderDraftEnvelope {
  const d = mergeDraftFromStorage(raw);
  if (!d.draftId || d.draftId.length < 32) {
    return { ...d, draftId: randomUUID() };
  }
  return d;
}

export function makeEmptyDraft(): ConversationalOrderDraftEnvelope {
  return ConversationalOrderDraftEnvelopeSchema.parse({
    version: "2",
    negotiationState: "NEGOTIATION_ACTIVE",
    implicitAcceptanceWindowMinutes: 120,
    workingTerms: {
      quantity: null,
      quantityUnit: null,
      unitPrice: null,
      currency: "XOF",
      deliveryHint: null,
      frequency: null,
      destination: null,
    },
    confidenceScore: 0.2,
    extractionConfidence: 0.2,
    implicitInterpretationRisk: 0.85,
    unresolvedFields: ["quantity", "unitPrice"],
    requiresHumanValidation: true,
    lastProposalMessageId: null,
    lastProposalOrganizationId: null,
    lastProposalAt: null,
    readinessNote: "NONE",
    revisionHistory: [],
    advisoryNote:
      "Couche heuristique — pas de commande juridique, pas de débit stock, pas de paiement. Toute formalisation finale reste humaine.",
    heuristicOnly: true,
    lastSymbolicReservationIntentId: null,
    draftId: randomUUID(),
    relationshipId: null,
    buyerOrganizationId: null,
    sellerOrganizationId: null,
    createsOrderAutomatically: false,
    convertibleToOrder: false,
    conversionStatus: "NONE",
    humanValidationRequired: true,
    hardOrderCreationDisabled: true,
    negotiationStatusMutation: "NONE",
    reservationIntentSafetyMode: "STRICT_SYMBOLIC",
    lastConfirmationSignal: "NONE",
  });
}

export function extractQuantity(text: string): { value: number; unit: string | null } | null {
  const t = text.trim();
  const m1 = t.match(/\b(\d+(?:[.,]\d+)?)\s*(cartons?|caisses?|unités?|pcs?|pièces?|sacs?|palette?s?|kg|tonnes?)\b/i);
  if (m1) {
    const v = Number(m1[1]!.replace(",", "."));
    if (Number.isFinite(v) && v > 0) return { value: v, unit: m1[2]!.toLowerCase() };
  }
  const m2 = t.match(/\b(\d{2,6})\s*(?=.*\b(carton|caisse|unité|palette|pièce|pcs)\b)/i);
  if (m2) {
    const v = Number(m2[1]!);
    if (Number.isFinite(v) && v > 0) {
      const u = t.match(UNIT_RE);
      return { value: v, unit: u ? u[1]!.toLowerCase() : null };
    }
  }
  return null;
}

export function extractPrice(text: string): { value: number; currency: string } | null {
  const m = text.match(/\b(\d+(?:[.,]\d+)?)\s*(cfa|xof|fcfa|€|eur|euros?)\b/i);
  if (!m) return null;
  const v = Number(m[1]!.replace(",", "."));
  if (!Number.isFinite(v) || v <= 0) return null;
  const cur = m[2]!.toUpperCase();
  const currency = cur === "EUR" || cur === "€" ? "EUR" : "XOF";
  return { value: v, currency };
}

export function extractDeliveryHint(text: string): string | null {
  const m = text.match(
    /\b(avant|pour)\s+(lundi|mardi|mercredi|jeudi|vendredi|samedi|dimanche|demain|aujourd'hui|\d{1,2}\/\d{1,2})\b/i,
  );
  return m ? m[0]!.slice(0, 120) : null;
}

/** @deprecated Instruction 20.1A — use classifyAcceptanceSignal */
export function looksLikeExplicitAccept(text: string): boolean {
  return classifyAcceptanceSignal(text) === "STRONG_CONFIRMATION";
}

export function classifyAcceptanceSignal(text: string): ConversationalConfirmationSignal {
  const t = text.trim();
  if (STRONG_ACCEPT_RE.test(t)) return "STRONG_CONFIRMATION";
  if (/\b(compris|j'ai compris)\b/i.test(t)) return "WEAK_ACKNOWLEDGEMENT";
  if (/^\s*oui\s*([!.?])?\s*$/i.test(t)) return "AMBIGUOUS_ACCEPTANCE";
  if (/\boui\b/i.test(t)) return "AMBIGUOUS_ACCEPTANCE";
  return "NONE";
}

export function looksLikeRejection(text: string): boolean {
  return REJECT_RE.test(text.trim());
}

export function looksLikeReservationAsk(text: string): boolean {
  return RESERVE_RE.test(text.trim());
}

export function reservationHoldHours(text: string): number {
  if (/\b(demain|tomorrow)\b/i.test(text)) return 24;
  if (/\b(une semaine|7 jours|semaine)\b/i.test(text)) return 168;
  if (/\b(48h|deux jours|2 jours)\b/i.test(text)) return 48;
  if (/\b(12h|douze heures)\b/i.test(text)) return 12;
  return 24;
}

type Msg = {
  id: string;
  senderOrganizationId: string;
  messageType: string;
  content: string | null;
  createdAt: Date;
};

function pushRevision(
  d: ConversationalOrderDraftEnvelope,
  rev: Omit<ConversationalDraftRevision, "at"> & { at?: string },
): ConversationalOrderDraftEnvelope {
  const r: ConversationalDraftRevision = {
    at: rev.at ?? new Date().toISOString(),
    messageId: rev.messageId,
    organizationId: rev.organizationId,
    kind: rev.kind,
    summary: rev.summary,
    snapshot: rev.snapshot,
  };
  return {
    ...d,
    revisionHistory: [...d.revisionHistory, r].slice(-200),
  };
}

function scoreDraft(d: ConversationalOrderDraftEnvelope): ConversationalOrderDraftEnvelope {
  const hasQty = d.workingTerms.quantity != null;
  const hasPrice = d.workingTerms.unitPrice != null;
  const extractionConfidence = Number(
    Math.min(1, 0.25 + (hasQty ? 0.28 : 0) + (hasPrice ? 0.28 : 0) + (d.workingTerms.deliveryHint ? 0.1 : 0)).toFixed(3),
  );
  const implicitRisk =
    d.negotiationState === "IMPLICIT_ACCEPTANCE" ? 0.55 : d.negotiationState === "PROPOSAL_PENDING" ? 0.4 : 0.85;
  const confidenceScore = Number(
    Math.min(1, extractionConfidence * 0.75 + (d.negotiationState === "DRAFT_READY" ? 0.2 : 0)).toFixed(3),
  );
  const unresolved: string[] = [];
  if (!hasQty) unresolved.push("quantity");
  if (!hasPrice) unresolved.push("unitPrice");
  if (!d.workingTerms.quantityUnit) unresolved.push("quantityUnit");
  return {
    ...d,
    extractionConfidence,
    implicitInterpretationRisk: Number(implicitRisk.toFixed(3)),
    confidenceScore,
    unresolvedFields: unresolved,
  };
}

function clearedWorkingTerms(): ConversationalOrderDraftEnvelope["workingTerms"] {
  return {
    quantity: null,
    quantityUnit: null,
    unitPrice: null,
    currency: "XOF",
    deliveryHint: null,
    frequency: null,
    destination: null,
  };
}

function messagesStrictlyBetween(messagesAsc: Msg[], startId: string, endId: string): Msg[] {
  const a = messagesAsc.findIndex((m) => m.id === startId);
  const b = messagesAsc.findIndex((m) => m.id === endId);
  if (a < 0 || b < 0 || b <= a) return [];
  return messagesAsc.slice(a + 1, b);
}

function hasRejectionAfterProposal(messagesAsc: Msg[], lastProposalId: string | null, untilExclusiveId: string): boolean {
  if (!lastProposalId) return false;
  const slice = messagesStrictlyBetween(messagesAsc, lastProposalId, untilExclusiveId);
  return slice.some((m) => m.messageType === "TEXT" && m.content && looksLikeRejection(m.content));
}

function canPromoteToDraftReady(args: {
  draft: ConversationalOrderDraftEnvelope;
  latest: Msg;
  thread: ThreadDraftContext;
  signal: ConversationalConfirmationSignal;
  messagesAsc: Msg[];
}): boolean {
  const { draft, latest, thread, signal, messagesAsc } = args;
  if (signal !== "STRONG_CONFIRMATION") return false;
  if (!draft.lastProposalOrganizationId || draft.lastProposalOrganizationId === latest.senderOrganizationId)
    return false;
  if (!thread.productId) return false;
  if (draft.workingTerms.quantity == null || !draft.workingTerms.quantityUnit) return false;
  if (!draft.lastProposalMessageId) return false;
  if (hasRejectionAfterProposal(messagesAsc, draft.lastProposalMessageId, latest.id)) return false;
  return true;
}

function evaluateImplicitSilence(args: {
  draft: ConversationalOrderDraftEnvelope;
  messagesAsc: Msg[];
  latest: Msg;
  thread: ThreadDraftContext;
}): ConversationalOrderDraftEnvelope {
  let d = args.draft;
  if (!d.lastProposalAt || !d.lastProposalMessageId || !d.lastProposalOrganizationId) return d;
  if (d.negotiationState === "DRAFT_REJECTED" || d.negotiationState === "DRAFT_CONFIRMED") return d;
  if (d.negotiationState === "DRAFT_READY" || d.negotiationState === "IMPLICIT_ACCEPTANCE") return d;
  if (!args.thread.productId) return d;
  if (d.workingTerms.quantity == null || !d.workingTerms.quantityUnit) return d;

  const windowMs = d.implicitAcceptanceWindowMinutes * 60_000;
  const proposalAt = new Date(d.lastProposalAt).getTime();
  const latestAt = args.latest.createdAt.getTime();
  if (latestAt - proposalAt < windowMs) return d;

  const idx = args.messagesAsc.findIndex((m) => m.id === d.lastProposalMessageId);
  if (idx < 0) return d;
  const between = args.messagesAsc.slice(idx + 1, -1);
  const otherOrg = d.lastProposalOrganizationId;
  const hasObjection = between.some(
    (m) =>
      m.senderOrganizationId !== otherOrg &&
      m.messageType === "TEXT" &&
      m.content &&
      (looksLikeRejection(m.content) || extractQuantity(m.content)),
  );
  if (hasObjection) return d;

  d = {
    ...d,
    negotiationState: "IMPLICIT_ACCEPTANCE" as RelationalNegotiationConversationState,
    readinessNote: "PENDING_CONFIRMATION",
    requiresHumanValidation: true,
    conversionStatus: "PENDING_CONFIRMATION",
    lastConfirmationSignal: "AMBIGUOUS_ACCEPTANCE",
    advisoryNote:
      "Acceptation implicite par fenêtre de silence — heuristique conversationnelle, jamais commande finale. Validation humaine requise avant toute conversion.",
  };
  return pushRevision(d, {
    messageId: args.latest.id,
    organizationId: args.latest.senderOrganizationId,
    kind: "IMPLICIT_SILENCE",
    summary: "Fenêtre conversationnelle écoulée sans contestation détectée sur la dernière proposition numérique.",
  });
}

/**
 * Applies one new TEXT (or structured) message onto the draft envelope.
 */
export function reduceDraftWithMessage(args: {
  draft: ConversationalOrderDraftEnvelope;
  messagesAsc: Msg[];
  latest: Msg;
  thread: ThreadDraftContext;
}): ConversationalOrderDraftEnvelope {
  const { latest, messagesAsc, thread } = args;
  let d: ConversationalOrderDraftEnvelope = {
    ...args.draft,
    buyerOrganizationId: thread.buyerOrganizationId,
    sellerOrganizationId: thread.sellerOrganizationId,
    relationshipId: thread.relationshipId,
  };

  if (latest.messageType !== "TEXT" || !latest.content) {
    return scoreDraft(evaluateImplicitSilence({ draft: d, messagesAsc, latest, thread }));
  }

  const text = latest.content;
  const sender = latest.senderOrganizationId;

  if (looksLikeRejection(text)) {
    d = {
      ...d,
      negotiationState: "NEGOTIATION_ACTIVE",
      readinessNote: "NONE",
      requiresHumanValidation: true,
      workingTerms: clearedWorkingTerms(),
      lastProposalMessageId: null,
      lastProposalOrganizationId: null,
      lastProposalAt: null,
      lastConfirmationSignal: "NONE",
      conversionStatus: "NONE",
    };
    d = pushRevision(d, {
      messageId: latest.id,
      organizationId: sender,
      kind: "REJECTION",
      summary: "Signal de refus — ancres proposition effacées (Instruction 20.1A).",
    });
    return scoreDraft(d);
  }

  const qty = extractQuantity(text);
  const price = extractPrice(text);
  const del = extractDeliveryHint(text);

  if (qty || price || del) {
    d = {
      ...d,
      workingTerms: {
        ...d.workingTerms,
        quantity: qty?.value ?? d.workingTerms.quantity,
        quantityUnit: qty?.unit ?? d.workingTerms.quantityUnit,
        unitPrice: price?.value ?? d.workingTerms.unitPrice,
        currency: price?.currency ?? d.workingTerms.currency,
        deliveryHint: del ?? d.workingTerms.deliveryHint,
      },
      negotiationState: "PROPOSAL_PENDING",
      lastProposalMessageId: latest.id,
      lastProposalOrganizationId: sender,
      lastProposalAt: latest.createdAt.toISOString(),
      readinessNote: "NONE",
      requiresHumanValidation: true,
      conversionStatus: "NONE",
    };
    d = pushRevision(d, {
      messageId: latest.id,
      organizationId: sender,
      kind: "TEXT_EXTRACTION",
      summary: `Extraction conversationnelle${qty ? ` qty=${qty.value}` : ""}${price ? ` prix=${price.value} ${price.currency}` : ""}${del ? ` délai=${del}` : ""}`,
      snapshot: { ...d.workingTerms },
    });
  }

  const sig = classifyAcceptanceSignal(text);
  d = { ...d, lastConfirmationSignal: sig };

  if (sig === "STRONG_CONFIRMATION" && canPromoteToDraftReady({ draft: d, latest, thread, signal: sig, messagesAsc })) {
    d = {
      ...d,
      negotiationState: "DRAFT_READY",
      readinessNote: "DRAFT_READY_FOR_HUMAN_CONFIRM",
      requiresHumanValidation: true,
      conversionStatus: "DRAFT_READY",
    };
    d = pushRevision(d, {
      messageId: latest.id,
      organizationId: sender,
      kind: "STRONG_ACCEPT_SIGNAL",
      summary: "Confirmation forte sur la dernière proposition chiffrée de la contrepartie.",
    });
  } else if (sig === "STRONG_CONFIRMATION") {
    d = {
      ...d,
      readinessNote: "PENDING_CONFIRMATION",
      conversionStatus: "PENDING_CONFIRMATION",
      negotiationState: d.negotiationState === "DRAFT_READY" ? "DRAFT_READY" : "PROPOSAL_PENDING",
    };
    d = pushRevision(d, {
      messageId: latest.id,
      organizationId: sender,
      kind: "STRONG_ACCEPT_SIGNAL",
      summary:
        "Confirmation forte détectée mais garde-fous 20.1A non satisfaits (produit, unité, absence de refus, contrepartie).",
    });
  } else if (sig === "WEAK_ACKNOWLEDGEMENT" || sig === "AMBIGUOUS_ACCEPTANCE") {
    d = {
      ...d,
      readinessNote: "PENDING_CONFIRMATION",
      negotiationState: d.negotiationState === "DRAFT_READY" ? d.negotiationState : "PROPOSAL_PENDING",
      conversionStatus: "PENDING_CONFIRMATION",
    };
    d = pushRevision(d, {
      messageId: latest.id,
      organizationId: sender,
      kind: "WEAK_ACK_SIGNAL",
      summary: `Signal conversationnel non contractuel (${sig}) — pas de DRAFT_READY automatique.`,
    });
  }

  d = evaluateImplicitSilence({ draft: d, messagesAsc, latest, thread });
  return scoreDraft(d);
}

/** Instruction 20.1A — strip active anchors after human reject (server-side). */
export function draftAnchorsClearedFromReject(
  prev: ConversationalOrderDraftEnvelope,
  actorOrganizationId: string,
): ConversationalOrderDraftEnvelope {
  const next = makeEmptyDraft();
  return {
    ...next,
    draftId: prev.draftId,
    revisionHistory: [
      ...prev.revisionHistory.slice(-80),
      {
        at: new Date().toISOString(),
        messageId: null,
        organizationId: actorOrganizationId,
        kind: "HUMAN_STRIP_REJECT" as const,
        summary: "Rejet humain — ancres et termes actifs effacés.",
      },
    ].slice(-200) as ConversationalOrderDraftEnvelope["revisionHistory"],
    negotiationState: "DRAFT_REJECTED",
    conversionStatus: "DRAFT_REJECTED",
    buyerOrganizationId: prev.buyerOrganizationId,
    sellerOrganizationId: prev.sellerOrganizationId,
    relationshipId: prev.relationshipId,
  };
}
