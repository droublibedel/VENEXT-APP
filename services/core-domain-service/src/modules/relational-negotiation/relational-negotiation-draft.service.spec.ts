import { describe, expect, it, vi } from "vitest";
import { ForbiddenException } from "@nestjs/common";
import { ReservationIntentSource } from "@prisma/client";
import { isSymbolicConversationReservationIntent } from "@venext/shared-contracts";

import { RelationalNegotiationDraftService } from "./relational-negotiation-draft.service";

const buyerOrg = "31111111-1111-4111-8111-111111111103";
const sellerOrg = "31111111-1111-4111-8111-111111111101";
const actor = { userId: "21111111-1111-4111-8111-111111111103", organizationId: buyerOrg, actorResolvedFrom: "AUTH_CONTEXT" as const };

describe("RelationalNegotiationDraftService — Instruction 20.1A", () => {
  it("confirmDraftHuman refuses without accepted corridor relationship", async () => {
    const prisma = {
      messageThread: {
        findUnique: vi.fn().mockResolvedValue({
          id: "91111111-1111-4111-8111-111111111001",
          negotiationId: "91111111-1111-4111-8111-111111111099",
          productId: "61111111-1111-4111-8111-111111111001",
          buyerOrganizationId: buyerOrg,
          sellerOrganizationId: sellerOrg,
          conversationalOrderDraft: {
            version: "2",
            negotiationState: "DRAFT_READY",
            workingTerms: {
              quantity: 10,
              quantityUnit: "cartons",
              unitPrice: 100,
              currency: "XOF",
              deliveryHint: null,
              frequency: null,
              destination: null,
            },
          },
        }),
      },
      relationship: {
        findFirst: vi.fn().mockResolvedValue(null),
      },
      negotiation: { findUnique: vi.fn(), update: vi.fn() },
      message: { create: vi.fn() },
      $transaction: vi.fn(),
    };
    const flags = { isEnabled: vi.fn().mockResolvedValue(true) };
    const realtime = { publish: vi.fn() };
    const threadAccess = {
      assertCanConfirmNegotiationDraft: vi.fn().mockResolvedValue({
        actorResolvedFrom: "AUTH_CONTEXT",
        bodyActorTrusted: false,
        threadMembershipValidated: true,
        threadWriteValidated: true,
        commercialConsistencyValidated: true,
        rejectedByThreadAccessCount: 0,
        rejectedByOrganizationMismatch: 0,
        rejectedByRelationshipMismatch: 0,
      }),
      assertCanReadThread: vi.fn(),
      assertCanWriteThread: vi.fn(),
    };
    const svc = new RelationalNegotiationDraftService(prisma as never, flags as never, realtime as never, threadAccess as never);
    await expect(
      svc.confirmDraftHuman({
        threadId: "91111111-1111-4111-8111-111111111001",
        actor,
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it("confirmDraftHuman updates negotiationDraftMetadata without Negotiation.status", async () => {
    const prisma = {
      messageThread: {
        findUnique: vi.fn().mockResolvedValue({
          id: "91111111-1111-4111-8111-111111111001",
          negotiationId: "91111111-1111-4111-8111-111111111099",
          productId: "61111111-1111-4111-8111-111111111001",
          buyerOrganizationId: buyerOrg,
          sellerOrganizationId: sellerOrg,
          conversationalOrderDraft: {
            version: "2",
            negotiationState: "DRAFT_READY",
            implicitAcceptanceWindowMinutes: 120,
            workingTerms: {
              quantity: 10,
              quantityUnit: "cartons",
              unitPrice: 100,
              currency: "XOF",
              deliveryHint: null,
              frequency: null,
              destination: null,
            },
            confidenceScore: 0.5,
            extractionConfidence: 0.5,
            implicitInterpretationRisk: 0.5,
            unresolvedFields: [],
            requiresHumanValidation: true,
            lastProposalMessageId: null,
            lastProposalOrganizationId: null,
            lastProposalAt: null,
            readinessNote: "DRAFT_READY_FOR_HUMAN_CONFIRM",
            revisionHistory: [],
            advisoryNote: "x",
            heuristicOnly: true,
            draftId: "f1111111-1111-4111-8111-111111111111",
            relationshipId: null,
            buyerOrganizationId: buyerOrg,
            sellerOrganizationId: sellerOrg,
            createsOrderAutomatically: false,
            convertibleToOrder: false,
            conversionStatus: "DRAFT_READY",
            humanValidationRequired: true,
            hardOrderCreationDisabled: true,
            negotiationStatusMutation: "NONE",
            reservationIntentSafetyMode: "STRICT_SYMBOLIC",
            lastConfirmationSignal: "STRONG_CONFIRMATION",
          },
        }),
        update: vi.fn().mockResolvedValue({}),
      },
      relationship: {
        findFirst: vi.fn().mockResolvedValue({ id: "rel-1" }),
      },
      negotiation: {
        findUnique: vi
          .fn()
          .mockResolvedValueOnce({
            id: "91111111-1111-4111-8111-111111111099",
            buyerOrganizationId: buyerOrg,
            sellerOrganizationId: sellerOrg,
            productId: "61111111-1111-4111-8111-111111111001",
            negotiationDraftMetadata: {},
          })
          .mockResolvedValueOnce({ negotiationDraftMetadata: {} }),
        update: vi.fn().mockResolvedValue({}),
      },
      message: { create: vi.fn().mockResolvedValue({ id: "m1111111-1111-4111-8111-111111111001" }) },
      $transaction: vi.fn(async (arg: unknown) => {
        if (typeof arg === "function") {
          return (arg as (tx: typeof prisma) => Promise<unknown>)(prisma);
        }
        return Promise.all(arg as Promise<unknown>[]);
      }),
    };
    const flags = { isEnabled: vi.fn().mockResolvedValue(true) };
    const realtime = { publish: vi.fn() };
    const threadAccess = {
      assertCanConfirmNegotiationDraft: vi.fn().mockResolvedValue({
        actorResolvedFrom: "AUTH_CONTEXT",
        bodyActorTrusted: false,
        threadMembershipValidated: true,
        threadWriteValidated: true,
        commercialConsistencyValidated: true,
        rejectedByThreadAccessCount: 0,
        rejectedByOrganizationMismatch: 0,
        rejectedByRelationshipMismatch: 0,
      }),
      assertCanReadThread: vi.fn(),
      assertCanWriteThread: vi.fn(),
    };
    const relationalCart = { createCartFromConversationalDraft: vi.fn().mockResolvedValue({ cart: {}, diagnostics: {} }) };
    const svc = new RelationalNegotiationDraftService(
      prisma as never,
      flags as never,
      realtime as never,
      threadAccess as never,
      undefined,
      undefined,
      relationalCart as never,
    );

    await svc.confirmDraftHuman({
      threadId: "91111111-1111-4111-8111-111111111001",
      actor,
    });

    expect(relationalCart.createCartFromConversationalDraft).toHaveBeenCalled();
    expect(prisma.negotiation.update).toHaveBeenCalled();
    const call = (prisma.negotiation.update as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(call.data.status).toBeUndefined();
    expect(call.data.negotiationDraftMetadata).toMatchObject({
      conversationalDraftConfirmed: true,
      hardNegotiationStatusChange: false,
    });
  });

  it("isSymbolicConversationReservationIntent marks 20.1A source and flagged metadata", () => {
    expect(
      isSymbolicConversationReservationIntent({
        source: ReservationIntentSource.CONVERSATIONAL_SYMBOLIC_DRAFT,
      }),
    ).toBe(true);
    expect(
      isSymbolicConversationReservationIntent({
        source: "CONVERSATION",
        metadata: { symbolic: true, conversationalHeuristic: true, notStockReservation: true },
      }),
    ).toBe(true);
  });
});
