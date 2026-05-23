import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  Optional,
} from "@nestjs/common";
import {
  CommercialCorridorState,
  MessageType,
  NegotiationStatus,
  Prisma,
  RelationalCartLineValidationStatus,
  RelationalCartSourceType,
  RelationalCartStatus,
  RelationshipStatus,
} from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";
import { SponsoredNegotiationAccessService } from "../commerce-thread-access/sponsored-negotiation-access.service";
import { RelationshipGovernancePolicyService } from "../relationship-governance/relationship-governance-policy.service";
import { CommercialTrustTouchService } from "../commercial-trust/commercial-trust-touch.service";
import { RelationshipGovernanceService } from "../relationship-governance/relationship-governance.service";
import { detectOptionalDependencyStatus } from "../relationship-governance/relationship-governance-optional-deps";
import { CanonicalFeatureFlagEvaluator } from "../../feature-flags/canonical-feature-flag.evaluator";
import { RelationalCartPolicyService } from "./relational-cart-policy.service";
import { RelationalCartRealtimePublishService } from "./relational-cart-realtime-publish.service";
import { RelationalCartResponseSchema, type RelationalCartRealtimeEventType } from "@venext/shared-contracts";

const d = (n: string | number) => new Prisma.Decimal(n);

@Injectable()
export class RelationalCartService {
  private static readonly log = new Logger(RelationalCartService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly sponsoredNegotiation: SponsoredNegotiationAccessService,
    private readonly policy: RelationalCartPolicyService,
    private readonly flags: CanonicalFeatureFlagEvaluator,
    @Optional() private readonly corridorPolicy?: RelationshipGovernancePolicyService,
    @Optional() private readonly trustTouch?: CommercialTrustTouchService,
    @Optional() private readonly corridorGovernance?: RelationshipGovernanceService,
    @Optional() private readonly realtime?: RelationalCartRealtimePublishService,
  ) {}

  private failClosedGovernance(): boolean {
    return process.env.NODE_ENV === "production" && process.env.VENEXT_GOVERNANCE_FAIL_CLOSED === "true";
  }

  private async assertCartGovernance(
    relationshipId: string,
    opts?: { allowRestrictedCommerceForBackoffice?: boolean; allowDormantOrderReactivation?: boolean },
  ): Promise<{ warnings: string[]; codes: string[]; validated: boolean }> {
    const failClosed = this.failClosedGovernance();
    const dep = detectOptionalDependencyStatus({
      cartConversionCorridorPolicyMissing: !this.corridorPolicy,
      negotiationCorridorPolicyMissing: false,
      trustProfileRowMissing: false,
      sponsoredSyncCorridorGovernanceMissing: false,
      corridorRealtimePublisherUnconfigured: false,
      commercialTrustTouchMissing: !this.trustTouch,
    });
    if (!this.corridorPolicy && failClosed) {
      throw new InternalServerErrorException({
        code: "governance_dependency_missing",
        detail: "relational_cart",
        optionalDependencyMissing: dep.optionalDependencyMissing,
      });
    }
    if (!this.corridorPolicy && process.env.NODE_ENV === "production" && !failClosed) {
      RelationalCartService.log.error(
        JSON.stringify({
          job: "relational_cart_governance",
          phase: "optional_dependency_missing",
          optionalDependencyMissing: dep.optionalDependencyMissing,
        }),
      );
    }
    const warnings: string[] = [];
    const codes: string[] = [];
    if (this.corridorPolicy) {
      const governanceTelemetry = { warnings, governanceWarningCodes: codes };
      await this.corridorPolicy.assertCorridorOperational(relationshipId, "cart_conversion", {
        governanceTelemetry,
        allowRestrictedCommerceForBackoffice: opts?.allowRestrictedCommerceForBackoffice,
        allowDormantOrderReactivation: opts?.allowDormantOrderReactivation,
      });
    }
    return { warnings, codes, validated: Boolean(this.corridorPolicy) };
  }

  private sourceTypeReadinessPayload(): Record<string, "READY" | "NOT_CONNECTED_YET" | "CONNECTED"> {
    return {
      NEGOTIATION_ACCEPTED: "READY",
      CONVERSATIONAL_DRAFT_CONFIRMED: "READY",
      SPONSORED_PRINCIPLE_AGREEMENT: "READY",
      MANUAL_RELATIONAL_ENTRY: "CONNECTED",
      RELATIONAL_REORDER: "NOT_CONNECTED_YET",
    };
  }

  private diagnosticsFromCartRow(
    cart: { corridorGovernanceValidated: boolean; corridorStateAtCreation: CommercialCorridorState; corridorOperationalWarnings: Prisma.JsonValue },
    extra?: Record<string, unknown>,
  ) {
    const w = Array.isArray(cart.corridorOperationalWarnings)
      ? (cart.corridorOperationalWarnings as unknown[]).filter((x): x is string => typeof x === "string")
      : [];
    return {
      relationshipScoped: true as const,
      publicMarketplaceDisabled: true as const,
      checkoutPublicDisabled: true as const,
      paymentExecutionDisabled: true as const,
      stockReservationDisabled: true as const,
      walletDebitDisabled: true as const,
      corridorGovernanceRequired: true as const,
      corridorGovernanceValidated: cart.corridorGovernanceValidated,
      corridorStateAtCreation: cart.corridorStateAtCreation,
      corridorOperationalWarnings: w,
      corridorPolicySource: "RelationshipGovernancePolicyService.assertCorridorOperational",
      heuristicOnly: true as const,
      sourceTypeReadiness: this.sourceTypeReadinessPayload(),
      ...extra,
    };
  }

  private workflowDiagnostics(cart: {
    status: RelationalCartStatus;
    buyerConfirmedAt: Date | null;
    sellerConfirmedAt: Date | null;
    items: { lineValidationStatus: RelationalCartLineValidationStatus }[];
    confirmationDiagnostics: Prisma.JsonValue;
    cartConvertibleToOrder: boolean;
    conversionBlockedReason: string | null;
    convertedOrderId: string | null;
  }): Record<string, unknown> {
    const buyerConfirmed = cart.buyerConfirmedAt != null;
    const sellerConfirmed = cart.sellerConfirmedAt != null;
    const cd =
      typeof cart.confirmationDiagnostics === "object" && cart.confirmationDiagnostics !== null
        ? (cart.confirmationDiagnostics as Record<string, unknown>)
        : {};
    const confirmationsResetBecauseCartChanged = cd["confirmationsResetBecauseCartChanged"] === true;
    const convertible = cart.items.every(
      (it) =>
        it.lineValidationStatus === RelationalCartLineValidationStatus.VALIDATED ||
        it.lineValidationStatus === RelationalCartLineValidationStatus.SYMBOLIC_STOCK_ONLY,
    );
    const bothPartiesConfirmed = buyerConfirmed && sellerConfirmed;
    const lockEligible =
      cart.status === RelationalCartStatus.CONFIRMED_BY_BOTH_PARTIES &&
      bothPartiesConfirmed &&
      cart.items.length > 0 &&
      convertible;
    const conversionEligible =
      cart.status === RelationalCartStatus.LOCKED_FOR_ORDER &&
      convertible &&
      cart.cartConvertibleToOrder &&
      !cart.conversionBlockedReason &&
      !cart.convertedOrderId;

    return {
      buyerConfirmed,
      sellerConfirmed,
      bothPartiesConfirmed,
      lockEligible,
      conversionEligible,
      confirmationsResetBecauseCartChanged,
      reviewStatus: cart.status,
    };
  }

  private readCartPolicyDisabledMetadata(cart: { metadata: Prisma.JsonValue }): {
    paymentExecutionDisabled: boolean;
    stockReservationDisabled: boolean;
  } {
    const md = typeof cart.metadata === "object" && cart.metadata ? (cart.metadata as Record<string, unknown>) : {};
    return {
      paymentExecutionDisabled: md["paymentExecutionDisabled"] !== false,
      stockReservationDisabled: md["stockReservationDisabled"] !== false,
    };
  }

  private assertLinesConvertibleForLock(items: { id: string; lineValidationStatus: RelationalCartLineValidationStatus }[]) {
    const allowed = new Set<RelationalCartLineValidationStatus>([
      RelationalCartLineValidationStatus.VALIDATED,
      RelationalCartLineValidationStatus.SYMBOLIC_STOCK_ONLY,
    ]);
    const blocked: { id: string; reason: string }[] = [];
    for (const it of items) {
      if (!allowed.has(it.lineValidationStatus)) blocked.push({ id: it.id, reason: it.lineValidationStatus });
    }
    if (blocked.length) {
      throw new BadRequestException({
        code: "relational_cart_line_requires_review",
        blockedLineIds: blocked.map((b) => b.id),
        blockedLineReasons: blocked.map((b) => b.reason),
        conversionBlockedByLineValidation: true,
      });
    }
  }

  private relationalCartRealtimeBody(
    cart: {
      id: string;
      relationshipId: string;
      status: RelationalCartStatus;
      sourceType: RelationalCartSourceType;
      corridorGovernanceValidated: boolean;
      buyerConfirmedAt: Date | null;
      sellerConfirmedAt: Date | null;
      items: { lineValidationStatus: RelationalCartLineValidationStatus }[];
      confirmationDiagnostics: Prisma.JsonValue;
      cartConvertibleToOrder: boolean;
      conversionBlockedReason: string | null;
      convertedOrderId: string | null;
    },
    changedFields: string[],
  ) {
    const wf = this.workflowDiagnostics(cart);
    return {
      cartId: cart.id,
      relationshipId: cart.relationshipId,
      status: cart.status,
      sourceType: cart.sourceType,
      changedFields,
      corridorGovernanceValidated: cart.corridorGovernanceValidated,
      paymentExecutionDisabled: true as const,
      computedAt: new Date().toISOString(),
      relationshipScoped: true as const,
      publicMarketplaceDisabled: true as const,
      checkoutPublicDisabled: true as const,
      stockReservationDisabled: true as const,
      corridorGovernanceRequired: true as const,
      heuristicOnly: true as const,
      buyerConfirmed: wf.buyerConfirmed as boolean,
      sellerConfirmed: wf.sellerConfirmed as boolean,
      bothPartiesConfirmed: wf.bothPartiesConfirmed as boolean,
      lockEligible: wf.lockEligible as boolean,
      conversionEligible: wf.conversionEligible as boolean,
    };
  }

  private async publishRelationalCartBothSides(
    cart: {
      id: string;
      buyerOrganizationId: string;
      sellerOrganizationId: string;
      relationshipId: string;
      status: RelationalCartStatus;
      sourceType: RelationalCartSourceType;
      corridorGovernanceValidated: boolean;
      buyerConfirmedAt: Date | null;
      sellerConfirmedAt: Date | null;
      items: { lineValidationStatus: RelationalCartLineValidationStatus }[];
      confirmationDiagnostics: Prisma.JsonValue;
      cartConvertibleToOrder: boolean;
      conversionBlockedReason: string | null;
      convertedOrderId: string | null;
    },
    eventType: RelationalCartRealtimeEventType,
    changedFields: string[],
  ) {
    const body = this.relationalCartRealtimeBody(cart, changedFields);
    await this.realtime?.publish(cart.buyerOrganizationId, eventType, body as never);
    await this.realtime?.publish(cart.sellerOrganizationId, eventType, body as never);
  }

  private confirmationResetPrismaFragment(previous: {
    status: RelationalCartStatus;
    confirmationDiagnostics: Prisma.JsonValue;
  }): Pick<
    Prisma.RelationalCartUpdateInput,
    "buyerConfirmedAt" | "sellerConfirmedAt" | "buyerConfirmedByUserId" | "sellerConfirmedByUserId" | "status" | "confirmationDiagnostics"
  > {
    const prevCd =
      typeof previous.confirmationDiagnostics === "object" && previous.confirmationDiagnostics
        ? { ...(previous.confirmationDiagnostics as object) }
        : {};
    const resetAt = new Date().toISOString();
    return {
      buyerConfirmedAt: null,
      sellerConfirmedAt: null,
      buyerConfirmedByUserId: null,
      sellerConfirmedByUserId: null,
      status: RelationalCartStatus.READY_FOR_REVIEW,
      confirmationDiagnostics: {
        ...prevCd,
        confirmationsResetBecauseCartChanged: true,
        lastContentChangeResetAt: resetAt,
        previousStatus: previous.status,
      } as Prisma.InputJsonValue,
    };
  }

  private confirmationResetMetadataPatch(previous: { metadata: Prisma.JsonValue; status: RelationalCartStatus }): Prisma.InputJsonValue {
    const prevMd = typeof previous.metadata === "object" && previous.metadata ? { ...(previous.metadata as object) } : {};
    const resetAt = new Date().toISOString();
    return {
      ...prevMd,
      confirmationResetReason: "CART_CONTENT_CHANGED",
      previousStatus: previous.status,
      resetAt,
    } as Prisma.InputJsonValue;
  }

  private needsConfirmationResetBecauseContentChanged(cart: {
    status: RelationalCartStatus;
    buyerConfirmedAt: Date | null;
    sellerConfirmedAt: Date | null;
  }): boolean {
    if (cart.buyerConfirmedAt || cart.sellerConfirmedAt) return true;
    return (
      cart.status === RelationalCartStatus.CONFIRMED_BY_BUYER ||
      cart.status === RelationalCartStatus.CONFIRMED_BY_SELLER ||
      cart.status === RelationalCartStatus.CONFIRMED_BY_BOTH_PARTIES
    );
  }

  private toResponse(cart: Awaited<ReturnType<typeof this.loadCart>>, diagnosticExtras?: Record<string, unknown>) {
    if (!cart) throw new NotFoundException("cart");
    const md = (typeof cart.metadata === "object" && cart.metadata ? cart.metadata : {}) as Record<string, unknown>;
    const threadDiag: Record<string, unknown> = {};
    if (typeof md.relationshipResolvedFromThread === "boolean") threadDiag.relationshipResolvedFromThread = md.relationshipResolvedFromThread;
    if (typeof md.threadRelationshipValidated === "boolean") threadDiag.threadRelationshipValidated = md.threadRelationshipValidated;
    if (typeof md.clientRelationshipIdIgnored === "boolean") threadDiag.clientRelationshipIdIgnored = md.clientRelationshipIdIgnored;
    const dto = {
      cart: {
        id: cart.id,
        organizationId: cart.organizationId,
        buyerOrganizationId: cart.buyerOrganizationId,
        sellerOrganizationId: cart.sellerOrganizationId,
        relationshipId: cart.relationshipId,
        negotiationId: cart.negotiationId,
        threadId: cart.threadId,
        sourceType: cart.sourceType,
        status: cart.status,
        corridorStateAtCreation: cart.corridorStateAtCreation,
        corridorGovernanceValidated: cart.corridorGovernanceValidated,
        corridorOperationalWarnings: Array.isArray(cart.corridorOperationalWarnings)
          ? (cart.corridorOperationalWarnings as string[])
          : [],
        corridorPolicySource: cart.corridorPolicySource,
        commercialTrustBand: cart.commercialTrustBand,
        requiresBuyerSellerConfirmation: cart.requiresBuyerSellerConfirmation,
        conversionBlockedReason: cart.conversionBlockedReason,
        cartConvertibleToOrder: cart.cartConvertibleToOrder,
        createdByUserId: cart.createdByUserId,
        expiresAt: cart.expiresAt?.toISOString() ?? null,
        convertedOrderId: cart.convertedOrderId,
        metadata: (typeof cart.metadata === "object" && cart.metadata ? cart.metadata : {}) as Record<string, unknown>,
        buyerConfirmedAt: cart.buyerConfirmedAt?.toISOString() ?? null,
        sellerConfirmedAt: cart.sellerConfirmedAt?.toISOString() ?? null,
        buyerConfirmedByUserId: cart.buyerConfirmedByUserId,
        sellerConfirmedByUserId: cart.sellerConfirmedByUserId,
        lockedAt: cart.lockedAt?.toISOString() ?? null,
        lockedByUserId: cart.lockedByUserId,
        rejectedAt: cart.rejectedAt?.toISOString() ?? null,
        rejectedByUserId: cart.rejectedByUserId,
        rejectionReason: cart.rejectionReason,
        confirmationDiagnostics:
          typeof cart.confirmationDiagnostics === "object" && cart.confirmationDiagnostics
            ? (cart.confirmationDiagnostics as Record<string, unknown>)
            : {},
        lockDiagnostics: typeof cart.lockDiagnostics === "object" && cart.lockDiagnostics ? (cart.lockDiagnostics as Record<string, unknown>) : {},
        createdAt: cart.createdAt.toISOString(),
        updatedAt: cart.updatedAt.toISOString(),
        items: cart.items.map((it) => ({
          id: it.id,
          cartId: it.cartId,
          productId: it.productId,
          catalogId: it.catalogId,
          quantity: it.quantity.toString(),
          unit: it.unit,
          symbolicStockStatus: it.symbolicStockStatus,
          sourceMessageId: it.sourceMessageId,
          sourceNegotiationId: it.sourceNegotiationId,
          sourceDraftRevisionId: it.sourceDraftRevisionId,
          lineValidationStatus: it.lineValidationStatus,
          metadata: (typeof it.metadata === "object" && it.metadata ? it.metadata : {}) as Record<string, unknown>,
          createdAt: it.createdAt.toISOString(),
          updatedAt: it.updatedAt.toISOString(),
        })),
      },
      diagnostics: {
        ...this.diagnosticsFromCartRow(cart, { ...threadDiag, ...this.workflowDiagnostics(cart), ...(diagnosticExtras ?? {}) }),
      },
    };
    const parsed = RelationalCartResponseSchema.safeParse(dto);
    if (!parsed.success) {
      RelationalCartService.log.error(parsed.error.flatten());
      throw new InternalServerErrorException({ code: "relational_cart_contract_validation_failed" });
    }
    return parsed.data;
  }

  private async loadCart(id: string) {
    return this.prisma.relationalCart.findUnique({
      where: { id },
      include: { items: { orderBy: { createdAt: "asc" }, take: 120 } },
    });
  }

  private orgPairOr(a: string, b: string): Prisma.RelationshipWhereInput[] {
    return [
      { AND: [{ requesterOrganizationId: a }, { receiverOrganizationId: b }] },
      { AND: [{ requesterOrganizationId: b }, { receiverOrganizationId: a }] },
      { AND: [{ upstreamOrganizationId: a }, { downstreamOrganizationId: b }] },
      { AND: [{ upstreamOrganizationId: b }, { downstreamOrganizationId: a }] },
    ];
  }

  private async resolveAcceptedRelationshipForNegotiation(neg: {
    buyerOrganizationId: string;
    sellerOrganizationId: string;
  }) {
    return this.prisma.relationship.findFirst({
      where: {
        status: RelationshipStatus.ACCEPTED,
        OR: this.orgPairOr(neg.buyerOrganizationId, neg.sellerOrganizationId),
      },
    });
  }

  async getCart(cartId: string, actorOrganizationId: string) {
    const cart = await this.loadCart(cartId);
    if (!cart) throw new NotFoundException(cartId);
    this.policy.assertActorParticipant(actorOrganizationId, cart.buyerOrganizationId, cart.sellerOrganizationId);
    return this.toResponse(cart);
  }

  async createCartFromNegotiation(
    negotiationId: string,
    actorUserId: string,
    actorOrganizationId: string,
    opts?: { allowRestrictedCommerceForBackoffice?: boolean; markNegotiationConverted?: boolean },
  ) {
    await this.sponsoredNegotiation.assertConvertToCartAllowed(negotiationId);
    const neg = await this.prisma.negotiation.findUnique({
      where: { id: negotiationId },
      include: { product: true },
    });
    if (!neg) throw new NotFoundException(negotiationId);
    if (neg.status !== NegotiationStatus.ACCEPTED) {
      throw new BadRequestException("negotiation_not_accepted");
    }
    if (!neg.acceptedQuantity || !neg.acceptedPrice) {
      throw new BadRequestException("missing_accepted_terms");
    }

    const rel = await this.resolveAcceptedRelationshipForNegotiation(neg);
    if (!rel?.id) throw new BadRequestException("no_active_relationship_for_edge");

    const gov = await this.assertCartGovernance(rel.id, opts);
    const relFull = await this.prisma.relationship.findUnique({
      where: { id: rel.id },
      select: { corridorState: true },
    });
    if (!relFull) throw new NotFoundException(rel.id);

    const line = await this.policy.validateLineForCart(neg.productId, {
      buyerOrganizationId: neg.buyerOrganizationId,
      sellerOrganizationId: neg.sellerOrganizationId,
      relationshipId: rel.id,
      negotiationId,
    });
    const lineStatus =
      line.lineValidation === "CATALOG_VISIBILITY_REQUIRES_REVIEW"
        ? RelationalCartLineValidationStatus.CATALOG_VISIBILITY_REQUIRES_REVIEW
        : line.lineValidation === "SYMBOLIC_STOCK_ONLY"
          ? RelationalCartLineValidationStatus.SYMBOLIC_STOCK_ONLY
          : RelationalCartLineValidationStatus.VALIDATED;

    const existing = await this.prisma.relationalCart.findFirst({
      where: { negotiationId, relationshipId: rel.id },
    });

    const negReset = existing && this.needsConfirmationResetBecauseContentChanged(existing);
    const negResetFrag = negReset ? this.confirmationResetPrismaFragment(existing) : {};
    const negResetMeta = negReset ? this.confirmationResetMetadataPatch(existing) : null;

    const cart = existing
      ? await this.prisma.relationalCart.update({
          where: { id: existing.id },
          data: {
            ...negResetFrag,
            status: RelationalCartStatus.READY_FOR_REVIEW,
            sourceType: RelationalCartSourceType.NEGOTIATION_ACCEPTED,
            requiresBuyerSellerConfirmation: true,
            cartConvertibleToOrder: true,
            conversionBlockedReason: null,
            corridorGovernanceValidated: gov.validated,
            corridorOperationalWarnings: gov.warnings as unknown as Prisma.InputJsonValue,
            corridorStateAtCreation: relFull.corridorState,
            metadata: (
              negResetMeta
                ? ({
                    ...(negResetMeta as Record<string, unknown>),
                    paymentExecutionDisabled: true,
                    checkoutPublicDisabled: true,
                    walletDebitDisabled: true,
                    stockReservationDisabled: true,
                    governanceWarningCodes: gov.codes,
                  } as Prisma.InputJsonValue)
                : ({
                    paymentExecutionDisabled: true,
                    checkoutPublicDisabled: true,
                    walletDebitDisabled: true,
                    stockReservationDisabled: true,
                    governanceWarningCodes: gov.codes,
                  } as Prisma.InputJsonValue)
            ),
            items: {
              deleteMany: {},
              create: [
                {
                  productId: neg.productId,
                  catalogId: line.catalogId,
                  quantity: neg.acceptedQuantity,
                  unit: line.unit,
                  symbolicStockStatus: line.symbolicStockStatus,
                  sourceNegotiationId: negotiationId,
                  lineValidationStatus: lineStatus,
                  metadata: line.itemMetadata,
                },
              ],
            },
          },
          include: { items: { orderBy: { createdAt: "asc" }, take: 120 } },
        })
      : await this.prisma.relationalCart.create({
          data: {
            organizationId: neg.buyerOrganizationId,
            buyerOrganizationId: neg.buyerOrganizationId,
            sellerOrganizationId: neg.sellerOrganizationId,
            relationshipId: rel.id,
            negotiationId,
            sourceType: RelationalCartSourceType.NEGOTIATION_ACCEPTED,
            status: RelationalCartStatus.READY_FOR_REVIEW,
            corridorStateAtCreation: relFull.corridorState,
            corridorGovernanceValidated: gov.validated,
            corridorOperationalWarnings: gov.warnings as unknown as Prisma.InputJsonValue,
            requiresBuyerSellerConfirmation: true,
            cartConvertibleToOrder: true,
            createdByUserId: actorUserId,
            metadata: {
              paymentExecutionDisabled: true,
              checkoutPublicDisabled: true,
              walletDebitDisabled: true,
              stockReservationDisabled: true,
              governanceWarningCodes: gov.codes,
            } as Prisma.InputJsonValue,
            items: {
              create: [
                {
                  productId: neg.productId,
                  catalogId: line.catalogId,
                  quantity: neg.acceptedQuantity,
                  unit: line.unit,
                  symbolicStockStatus: line.symbolicStockStatus,
                  sourceNegotiationId: negotiationId,
                  lineValidationStatus: lineStatus,
                  metadata: line.itemMetadata,
                },
              ],
            },
          },
          include: { items: { orderBy: { createdAt: "asc" }, take: 120 } },
        });

    if (opts?.markNegotiationConverted) {
      await this.prisma.negotiation.update({
        where: { id: negotiationId },
        data: { status: NegotiationStatus.CONVERTED_TO_CART },
      });
    }

    const thread = await this.prisma.messageThread.findFirst({ where: { negotiationId } });
    if (thread) {
      await this.prisma.message.create({
        data: {
          threadId: thread.id,
          senderUserId: actorUserId,
          senderOrganizationId: actorOrganizationId,
          messageType: MessageType.CART_CONVERSION_EVENT,
          content:
            "Préparation de commande relationnelle — panier corridor (20.5) ; pas de checkout public, pas d’exécution paiement.",
          structuredEvent: {
            kind: "relational_cart_materialized",
            relationalCartId: cart.id,
            negotiationId,
          } as Prisma.InputJsonValue,
        },
      });
    }

    this.trustTouch?.touchOrganizations([neg.buyerOrganizationId, neg.sellerOrganizationId]);
    this.corridorGovernance?.touchRelationship(rel.id);

    const body = {
      cartId: cart.id,
      relationshipId: cart.relationshipId,
      status: cart.status,
      sourceType: cart.sourceType,
      changedFields: existing ? ["status", "items"] : ["created"],
      corridorGovernanceValidated: cart.corridorGovernanceValidated,
      paymentExecutionDisabled: true as const,
      computedAt: new Date().toISOString(),
      relationshipScoped: true as const,
      publicMarketplaceDisabled: true as const,
      checkoutPublicDisabled: true as const,
      stockReservationDisabled: true as const,
      corridorGovernanceRequired: true as const,
      heuristicOnly: true as const,
    };
    await this.realtime?.publish(cart.buyerOrganizationId, existing ? "relational.cart.updated" : "relational.cart.created", body);
    await this.realtime?.publish(cart.sellerOrganizationId, existing ? "relational.cart.updated" : "relational.cart.created", body);
    await this.realtime?.publish(cart.buyerOrganizationId, "relational.cart.ready_for_review", body);
    await this.realtime?.publish(cart.sellerOrganizationId, "relational.cart.ready_for_review", body);
    if (negReset) {
      await this.publishRelationalCartBothSides(cart, "relational.cart.confirmations_reset", [
        "items",
        "status",
        "confirmationDiagnostics",
        "metadata",
      ]);
    }

    return { ...this.toResponse(cart), cartId: cart.id };
  }

  async createCartFromConversationalDraft(input: {
    threadId: string;
    /** Optional internal narrowing; must equal server-resolved ACCEPTED corridor or request is rejected. */
    relationshipId?: string;
    actorUserId: string;
    actorOrganizationId: string;
    negotiationId: string;
    productId: string;
    quantity: number;
    unitPrice: number;
    quantityUnit: string;
    currency?: string | null;
    sourceMessageId?: string | null;
  }) {
    const thread = await this.prisma.messageThread.findUnique({
      where: { id: input.threadId },
      select: {
        buyerOrganizationId: true,
        sellerOrganizationId: true,
        negotiationId: true,
      },
    });
    if (!thread?.buyerOrganizationId || !thread.sellerOrganizationId) {
      throw new BadRequestException("thread_orgs_required");
    }
    if (thread.negotiationId && thread.negotiationId !== input.negotiationId) {
      throw new BadRequestException({
        code: "thread_relationship_mismatch",
        detail: "negotiationId does not match thread.negotiationId",
        threadRelationshipValidated: false,
      });
    }

    const resolvedRel = await this.resolveAcceptedRelationshipForNegotiation({
      buyerOrganizationId: thread.buyerOrganizationId,
      sellerOrganizationId: thread.sellerOrganizationId,
    });
    if (!resolvedRel?.id) {
      throw new BadRequestException({
        code: "thread_relationship_mismatch",
        detail: "no_accepted_corridor_for_thread",
        threadRelationshipValidated: false,
      });
    }
    if (input.relationshipId !== undefined && input.relationshipId !== resolvedRel.id) {
      throw new BadRequestException({
        code: "thread_relationship_mismatch",
        detail: "relationshipId does not match corridor resolved from thread",
        threadRelationshipValidated: false,
      });
    }
    const relationshipId = resolvedRel.id;

    const gov = await this.assertCartGovernance(relationshipId);

    const relFull = await this.prisma.relationship.findUnique({
      where: { id: relationshipId },
      select: { corridorState: true },
    });
    if (!relFull) throw new NotFoundException(relationshipId);

    const line = await this.policy.validateLineForCart(input.productId, {
      buyerOrganizationId: thread.buyerOrganizationId,
      sellerOrganizationId: thread.sellerOrganizationId,
      relationshipId,
      negotiationId: input.negotiationId,
      threadId: input.threadId,
    });
    const lineStatus =
      line.lineValidation === "CATALOG_VISIBILITY_REQUIRES_REVIEW"
        ? RelationalCartLineValidationStatus.CATALOG_VISIBILITY_REQUIRES_REVIEW
        : line.lineValidation === "SYMBOLIC_STOCK_ONLY"
          ? RelationalCartLineValidationStatus.SYMBOLIC_STOCK_ONLY
          : RelationalCartLineValidationStatus.VALIDATED;

    const existing = await this.prisma.relationalCart.findFirst({
      where: { threadId: input.threadId, relationshipId },
    });

    const draftReset = existing && this.needsConfirmationResetBecauseContentChanged(existing);
    const draftResetFrag = draftReset ? this.confirmationResetPrismaFragment(existing) : {};
    const draftResetMeta = draftReset ? this.confirmationResetMetadataPatch(existing) : null;

    const qty = d(input.quantity);

    const cart = existing
      ? await this.prisma.relationalCart.update({
          where: { id: existing.id },
          data: {
            ...draftResetFrag,
            negotiationId: input.negotiationId,
            sourceType: RelationalCartSourceType.CONVERSATIONAL_DRAFT_CONFIRMED,
            status: RelationalCartStatus.READY_FOR_REVIEW,
            requiresBuyerSellerConfirmation: true,
            cartConvertibleToOrder: true,
            corridorGovernanceValidated: gov.validated,
            corridorOperationalWarnings: gov.warnings as unknown as Prisma.InputJsonValue,
            corridorStateAtCreation: relFull.corridorState,
            metadata: (
              draftResetMeta
                ? ({
                    ...(draftResetMeta as Record<string, unknown>),
                    paymentExecutionDisabled: true,
                    checkoutPublicDisabled: true,
                    relationshipResolvedFromThread: true,
                    threadRelationshipValidated: true,
                    clientRelationshipIdIgnored: input.relationshipId === undefined,
                    conversationalDraftTerms: {
                      quantity: input.quantity,
                      unitPrice: input.unitPrice,
                      quantityUnit: input.quantityUnit,
                      currency: input.currency,
                    },
                  } as Prisma.InputJsonValue)
                : ({
                    paymentExecutionDisabled: true,
                    checkoutPublicDisabled: true,
                    relationshipResolvedFromThread: true,
                    threadRelationshipValidated: true,
                    clientRelationshipIdIgnored: input.relationshipId === undefined,
                    conversationalDraftTerms: {
                      quantity: input.quantity,
                      unitPrice: input.unitPrice,
                      quantityUnit: input.quantityUnit,
                      currency: input.currency,
                    },
                  } as Prisma.InputJsonValue)
            ),
            items: {
              deleteMany: {},
              create: [
                {
                  productId: input.productId,
                  catalogId: line.catalogId,
                  quantity: qty,
                  unit: input.quantityUnit,
                  symbolicStockStatus: line.symbolicStockStatus,
                  sourceMessageId: input.sourceMessageId ?? undefined,
                  sourceNegotiationId: input.negotiationId,
                  lineValidationStatus: lineStatus,
                  metadata: line.itemMetadata,
                },
              ],
            },
          },
          include: { items: { orderBy: { createdAt: "asc" }, take: 120 } },
        })
      : await this.prisma.relationalCart.create({
          data: {
            organizationId: thread.buyerOrganizationId,
            buyerOrganizationId: thread.buyerOrganizationId,
            sellerOrganizationId: thread.sellerOrganizationId,
            relationshipId,
            negotiationId: input.negotiationId,
            threadId: input.threadId,
            sourceType: RelationalCartSourceType.CONVERSATIONAL_DRAFT_CONFIRMED,
            status: RelationalCartStatus.READY_FOR_REVIEW,
            corridorStateAtCreation: relFull.corridorState,
            corridorGovernanceValidated: gov.validated,
            corridorOperationalWarnings: gov.warnings as unknown as Prisma.InputJsonValue,
            requiresBuyerSellerConfirmation: true,
            cartConvertibleToOrder: true,
            createdByUserId: input.actorUserId,
            metadata: {
              paymentExecutionDisabled: true,
              checkoutPublicDisabled: true,
              relationshipResolvedFromThread: true,
              threadRelationshipValidated: true,
              clientRelationshipIdIgnored: input.relationshipId === undefined,
              conversationalDraftTerms: {
                quantity: input.quantity,
                unitPrice: input.unitPrice,
                quantityUnit: input.quantityUnit,
                currency: input.currency,
              },
            } as Prisma.InputJsonValue,
            items: {
              create: [
                {
                  productId: input.productId,
                  catalogId: line.catalogId,
                  quantity: qty,
                  unit: input.quantityUnit,
                  symbolicStockStatus: line.symbolicStockStatus,
                  sourceMessageId: input.sourceMessageId ?? undefined,
                  sourceNegotiationId: input.negotiationId,
                  lineValidationStatus: lineStatus,
                  metadata: line.itemMetadata,
                },
              ],
            },
          },
          include: { items: { orderBy: { createdAt: "asc" }, take: 120 } },
        });

    this.trustTouch?.touchOrganizations([thread.buyerOrganizationId, thread.sellerOrganizationId]);
    this.corridorGovernance?.touchRelationship(relationshipId);

    const rt = {
      cartId: cart.id,
      relationshipId: cart.relationshipId,
      status: cart.status,
      sourceType: cart.sourceType,
      changedFields: ["items", "status", "sourceType"],
      corridorGovernanceValidated: cart.corridorGovernanceValidated,
      paymentExecutionDisabled: true as const,
      computedAt: new Date().toISOString(),
      relationshipScoped: true as const,
      publicMarketplaceDisabled: true as const,
      checkoutPublicDisabled: true as const,
      stockReservationDisabled: true as const,
      corridorGovernanceRequired: true as const,
      heuristicOnly: true as const,
    };
    await this.realtime?.publish(cart.buyerOrganizationId, existing ? "relational.cart.updated" : "relational.cart.created", rt);
    await this.realtime?.publish(cart.sellerOrganizationId, existing ? "relational.cart.updated" : "relational.cart.created", rt);
    if (draftReset) {
      await this.publishRelationalCartBothSides(cart, "relational.cart.confirmations_reset", [
        "items",
        "status",
        "confirmationDiagnostics",
        "metadata",
      ]);
    }

    return this.toResponse(cart);
  }

  async createCartFromSponsoredPrincipleAgreement(negotiationId: string) {
    const ctx = await this.sponsoredNegotiation.sponsoredNegotiationContext(negotiationId);
    if (!ctx.sponsoredNegotiation) {
      return { created: false, reason: "NOT_SPONSORED" as const };
    }
    if (ctx.hasAcceptedRelationship) {
      return { created: false, reason: "USE_STANDARD_NEGOTIATION_CART" as const };
    }
    return {
      created: false,
      reason: "RELATIONSHIP_REQUIRED" as const,
      diagnostics: {
        sponsoredPrincipleAgreement: true,
        relationshipStillRequired: true,
        cartConvertibleToOrder: false,
      },
    };
  }

  async reviewCart(cartId: string, actorUserId: string, actorOrganizationId: string) {
    void actorUserId;
    const cart = await this.loadCart(cartId);
    if (!cart) throw new NotFoundException(cartId);
    this.policy.assertActorParticipant(actorOrganizationId, cart.buyerOrganizationId, cart.sellerOrganizationId);
    const on = await this.flags.isEnabled("relational_cart_review_enabled", { organizationId: actorOrganizationId });
    if (!on) throw new ForbiddenException({ code: "relational_cart_review_disabled" });
    if (
      cart.status === RelationalCartStatus.LOCKED_FOR_ORDER ||
      cart.status === RelationalCartStatus.CONVERTED_TO_ORDER ||
      cart.status === RelationalCartStatus.REJECTED ||
      cart.status === RelationalCartStatus.EXPIRED
    ) {
      throw new BadRequestException({ code: "relational_cart_review_invalid_state" });
    }
    if (
      cart.status === RelationalCartStatus.CONFIRMED_BY_BUYER ||
      cart.status === RelationalCartStatus.CONFIRMED_BY_SELLER ||
      cart.status === RelationalCartStatus.CONFIRMED_BY_BOTH_PARTIES
    ) {
      throw new BadRequestException({ code: "relational_cart_review_invalid_state" });
    }
    if (cart.status === RelationalCartStatus.READY_FOR_REVIEW) {
      return this.toResponse(cart);
    }
    const updated = await this.prisma.relationalCart.update({
      where: { id: cartId },
      data: { status: RelationalCartStatus.READY_FOR_REVIEW },
      include: { items: { orderBy: { createdAt: "asc" }, take: 120 } },
    });
    await this.publishRelationalCartBothSides(updated, "relational.cart.reviewed", ["status"]);
    return this.toResponse(updated);
  }

  async confirmCartBuyer(cartId: string, actorUserId: string, actorOrganizationId: string) {
    const cart = await this.loadCart(cartId);
    if (!cart) throw new NotFoundException(cartId);
    if (actorOrganizationId !== cart.buyerOrganizationId) {
      throw new ForbiddenException({ code: "relational_cart_buyer_org_required" });
    }
    const dual = await this.flags.isEnabled("relational_cart_dual_confirmation_enabled", { organizationId: actorOrganizationId });
    if (!dual) throw new ForbiddenException({ code: "relational_cart_dual_confirmation_disabled" });
    const review = await this.flags.isEnabled("relational_cart_review_enabled", { organizationId: actorOrganizationId });
    if (!review) throw new ForbiddenException({ code: "relational_cart_review_disabled" });
    if (
      cart.status === RelationalCartStatus.LOCKED_FOR_ORDER ||
      cart.status === RelationalCartStatus.CONVERTED_TO_ORDER ||
      cart.status === RelationalCartStatus.REJECTED ||
      cart.status === RelationalCartStatus.EXPIRED
    ) {
      throw new BadRequestException({ code: "relational_cart_invalid_state_for_buyer_confirm" });
    }
    if (
      cart.buyerConfirmedAt &&
      (cart.status === RelationalCartStatus.CONFIRMED_BY_BUYER || cart.status === RelationalCartStatus.CONFIRMED_BY_BOTH_PARTIES)
    ) {
      return this.toResponse(cart);
    }

    let next = cart.status;
    if (cart.status === RelationalCartStatus.READY_FOR_REVIEW || cart.status === RelationalCartStatus.DRAFT) {
      next = cart.sellerConfirmedAt ? RelationalCartStatus.CONFIRMED_BY_BOTH_PARTIES : RelationalCartStatus.CONFIRMED_BY_BUYER;
    } else if (cart.status === RelationalCartStatus.CONFIRMED_BY_SELLER) {
      next = RelationalCartStatus.CONFIRMED_BY_BOTH_PARTIES;
    } else if (cart.status === RelationalCartStatus.CONFIRMED_BY_BUYER) {
      next = RelationalCartStatus.CONFIRMED_BY_BUYER;
    } else {
      throw new BadRequestException({ code: "relational_cart_invalid_state_for_buyer_confirm" });
    }

    const buyerAt = cart.buyerConfirmedAt ?? new Date();
    const buyerBy = cart.buyerConfirmedByUserId ?? actorUserId;
    const prevCd: Record<string, unknown> =
      typeof cart.confirmationDiagnostics === "object" && cart.confirmationDiagnostics !== null && !Array.isArray(cart.confirmationDiagnostics)
        ? { ...(cart.confirmationDiagnostics as Record<string, unknown>) }
        : {};
    const confirmationDiagnostics: Prisma.InputJsonValue =
      prevCd["confirmationsResetBecauseCartChanged"] === true
        ? ({ ...prevCd, confirmationsResetBecauseCartChanged: false } as Prisma.InputJsonValue)
        : (prevCd as Prisma.InputJsonValue);

    const updated = await this.prisma.relationalCart.update({
      where: { id: cartId },
      data: {
        status: next,
        buyerConfirmedAt: buyerAt,
        buyerConfirmedByUserId: buyerBy,
        confirmationDiagnostics,
      },
      include: { items: { orderBy: { createdAt: "asc" }, take: 120 } },
    });
    await this.publishRelationalCartBothSides(updated, "relational.cart.buyer_confirmed", ["status", "buyerConfirmedAt"]);
    if (updated.status === RelationalCartStatus.CONFIRMED_BY_BOTH_PARTIES) {
      await this.publishRelationalCartBothSides(updated, "relational.cart.both_parties_confirmed", ["status"]);
    }
    return this.toResponse(updated);
  }

  async confirmCartSeller(cartId: string, actorUserId: string, actorOrganizationId: string) {
    const cart = await this.loadCart(cartId);
    if (!cart) throw new NotFoundException(cartId);
    if (actorOrganizationId !== cart.sellerOrganizationId) {
      throw new ForbiddenException({ code: "relational_cart_seller_org_required" });
    }
    const dual = await this.flags.isEnabled("relational_cart_dual_confirmation_enabled", { organizationId: actorOrganizationId });
    if (!dual) throw new ForbiddenException({ code: "relational_cart_dual_confirmation_disabled" });
    const review = await this.flags.isEnabled("relational_cart_review_enabled", { organizationId: actorOrganizationId });
    if (!review) throw new ForbiddenException({ code: "relational_cart_review_disabled" });
    if (
      cart.status === RelationalCartStatus.LOCKED_FOR_ORDER ||
      cart.status === RelationalCartStatus.CONVERTED_TO_ORDER ||
      cart.status === RelationalCartStatus.REJECTED ||
      cart.status === RelationalCartStatus.EXPIRED
    ) {
      throw new BadRequestException({ code: "relational_cart_invalid_state_for_seller_confirm" });
    }
    if (
      cart.sellerConfirmedAt &&
      (cart.status === RelationalCartStatus.CONFIRMED_BY_SELLER || cart.status === RelationalCartStatus.CONFIRMED_BY_BOTH_PARTIES)
    ) {
      return this.toResponse(cart);
    }

    let next = cart.status;
    if (cart.status === RelationalCartStatus.READY_FOR_REVIEW || cart.status === RelationalCartStatus.DRAFT) {
      next = cart.buyerConfirmedAt ? RelationalCartStatus.CONFIRMED_BY_BOTH_PARTIES : RelationalCartStatus.CONFIRMED_BY_SELLER;
    } else if (cart.status === RelationalCartStatus.CONFIRMED_BY_BUYER) {
      next = RelationalCartStatus.CONFIRMED_BY_BOTH_PARTIES;
    } else if (cart.status === RelationalCartStatus.CONFIRMED_BY_SELLER) {
      next = RelationalCartStatus.CONFIRMED_BY_SELLER;
    } else {
      throw new BadRequestException({ code: "relational_cart_invalid_state_for_seller_confirm" });
    }

    const sellerAt = cart.sellerConfirmedAt ?? new Date();
    const sellerBy = cart.sellerConfirmedByUserId ?? actorUserId;
    const prevCd: Record<string, unknown> =
      typeof cart.confirmationDiagnostics === "object" && cart.confirmationDiagnostics !== null && !Array.isArray(cart.confirmationDiagnostics)
        ? { ...(cart.confirmationDiagnostics as Record<string, unknown>) }
        : {};
    const confirmationDiagnostics: Prisma.InputJsonValue =
      prevCd["confirmationsResetBecauseCartChanged"] === true
        ? ({ ...prevCd, confirmationsResetBecauseCartChanged: false } as Prisma.InputJsonValue)
        : (prevCd as Prisma.InputJsonValue);

    const updated = await this.prisma.relationalCart.update({
      where: { id: cartId },
      data: {
        status: next,
        sellerConfirmedAt: sellerAt,
        sellerConfirmedByUserId: sellerBy,
        confirmationDiagnostics,
      },
      include: { items: { orderBy: { createdAt: "asc" }, take: 120 } },
    });
    await this.publishRelationalCartBothSides(updated, "relational.cart.seller_confirmed", ["status", "sellerConfirmedAt"]);
    if (updated.status === RelationalCartStatus.CONFIRMED_BY_BOTH_PARTIES) {
      await this.publishRelationalCartBothSides(updated, "relational.cart.both_parties_confirmed", ["status"]);
    }
    return this.toResponse(updated);
  }

  async lockCartForOrder(cartId: string, actorUserId: string, actorOrganizationId: string) {
    const cart = await this.loadCart(cartId);
    if (!cart) throw new NotFoundException(cartId);
    this.policy.assertActorParticipant(actorOrganizationId, cart.buyerOrganizationId, cart.sellerOrganizationId);
    const lockOn = await this.flags.isEnabled("relational_cart_lock_enabled", { organizationId: actorOrganizationId });
    if (!lockOn) throw new ForbiddenException({ code: "relational_cart_lock_disabled" });
    if (cart.status !== RelationalCartStatus.CONFIRMED_BY_BOTH_PARTIES) {
      throw new BadRequestException({ code: "relational_cart_lock_requires_dual_confirmation" });
    }
    if (!cart.buyerConfirmedAt || !cart.sellerConfirmedAt) {
      throw new BadRequestException({ code: "relational_cart_lock_requires_dual_confirmation" });
    }
    if (!cart.items.length) {
      throw new BadRequestException({ code: "relational_cart_empty" });
    }
    this.assertLinesConvertibleForLock(cart.items);
    const pol = this.readCartPolicyDisabledMetadata(cart);
    if (!pol.paymentExecutionDisabled || !pol.stockReservationDisabled) {
      throw new ForbiddenException({ code: "relational_cart_lock_policy_violation" });
    }
    const rel = await this.prisma.relationship.findUnique({
      where: { id: cart.relationshipId },
      select: { id: true, status: true },
    });
    if (!rel || rel.status !== RelationshipStatus.ACCEPTED) {
      throw new ForbiddenException({ code: "relationship_accepted_required_for_order_conversion" });
    }
    const govTel = { warnings: [] as string[], governanceWarningCodes: [] as string[] };
    if (this.corridorPolicy) {
      await this.corridorPolicy.assertCorridorOperational(cart.relationshipId, "cart_conversion", {
        governanceTelemetry: govTel,
      });
    }
    const lockedAt = new Date();
    const lockDiag = {
      appliedAt: lockedAt.toISOString(),
      lockedByUserId: actorUserId,
      relationshipId: cart.relationshipId,
      itemsCount: cart.items.length,
    };
    const updated = await this.prisma.relationalCart.update({
      where: { id: cartId },
      data: {
        status: RelationalCartStatus.LOCKED_FOR_ORDER,
        lockedAt,
        lockedByUserId: actorUserId,
        lockDiagnostics: lockDiag as Prisma.InputJsonValue,
      },
      include: { items: { orderBy: { createdAt: "asc" }, take: 120 } },
    });
    await this.publishRelationalCartBothSides(updated, "relational.cart.locked_for_order", ["status", "lockedAt", "lockDiagnostics"]);
    await this.publishRelationalCartBothSides(updated, "relational.cart.locked", ["status"]);
    return this.toResponse(updated);
  }

  async expireCart(cartId: string, actorUserId: string, actorOrganizationId: string) {
    void actorUserId;
    const cart = await this.loadCart(cartId);
    if (!cart) throw new NotFoundException(cartId);
    this.policy.assertActorParticipant(actorOrganizationId, cart.buyerOrganizationId, cart.sellerOrganizationId);
    if (cart.status === RelationalCartStatus.CONVERTED_TO_ORDER) {
      throw new BadRequestException({ code: "relational_cart_expire_invalid_state" });
    }
    if (cart.status === RelationalCartStatus.EXPIRED) {
      return this.toResponse(cart);
    }
    const updated = await this.prisma.relationalCart.update({
      where: { id: cartId },
      data: { status: RelationalCartStatus.EXPIRED },
      include: { items: { orderBy: { createdAt: "asc" }, take: 120 } },
    });
    await this.publishRelationalCartBothSides(updated, "relational.cart.expired", ["status"]);
    return this.toResponse(updated);
  }

  async rejectCart(cartId: string, actorUserId: string, actorOrganizationId: string, reason?: string | null) {
    const cart = await this.loadCart(cartId);
    if (!cart) throw new NotFoundException(cartId);
    this.policy.assertActorParticipant(actorOrganizationId, cart.buyerOrganizationId, cart.sellerOrganizationId);
    if (cart.status === RelationalCartStatus.CONVERTED_TO_ORDER || cart.status === RelationalCartStatus.REJECTED) {
      throw new BadRequestException({ code: "relational_cart_reject_invalid_state" });
    }
    const now = new Date();
    const updated = await this.prisma.relationalCart.update({
      where: { id: cartId },
      data: {
        status: RelationalCartStatus.REJECTED,
        cartConvertibleToOrder: false,
        rejectedAt: now,
        rejectedByUserId: actorUserId,
        rejectionReason: reason?.trim() ? reason.trim().slice(0, 4000) : "unspecified",
      },
      include: { items: { orderBy: { createdAt: "asc" }, take: 120 } },
    });
    await this.publishRelationalCartBothSides(updated, "relational.cart.rejected", ["status", "rejectedAt", "cartConvertibleToOrder"]);
    return this.toResponse(updated);
  }

  private assertRelationshipParties(
    rel: {
      requesterOrganizationId: string;
      receiverOrganizationId: string;
      upstreamOrganizationId: string | null;
      downstreamOrganizationId: string | null;
    },
    buyerOrganizationId: string,
    sellerOrganizationId: string,
  ) {
    const parties = new Set(
      [rel.requesterOrganizationId, rel.receiverOrganizationId, rel.upstreamOrganizationId, rel.downstreamOrganizationId].filter(
        (x): x is string => typeof x === "string" && x.length > 0,
      ),
    );
    if (!parties.has(buyerOrganizationId) || !parties.has(sellerOrganizationId) || buyerOrganizationId === sellerOrganizationId) {
      throw new ForbiddenException({ code: "relational_cart_corridor_orgs_mismatch" });
    }
  }

  private validateDirectCatalogQuantity(quantity: number, unitRaw: string, productUnitLabel: string) {
    if (!Number.isFinite(quantity) || quantity <= 0) {
      throw new BadRequestException({ code: "relational_cart_invalid_quantity" });
    }
    if (quantity > 10_000_000) {
      throw new BadRequestException({ code: "relational_cart_quantity_unreasonable" });
    }
    const unit = unitRaw.trim();
    const expected = productUnitLabel.trim();
    if (!unit || unit !== expected) {
      throw new BadRequestException({ code: "relational_cart_unit_mismatch" });
    }
    const moqRaw = process.env.VENEXT_DIRECT_CATALOG_TEST_MOQ?.trim();
    const packRaw = process.env.VENEXT_DIRECT_CATALOG_TEST_PACK_SIZE?.trim();
    let minimumOrderQuantityApplied = false;
    let packSizeWarning = false;
    let quantityRequiresReview = false;
    const quantityBusinessRuleNotConfigured = !moqRaw && !packRaw;
    if (moqRaw) {
      const moq = Number(moqRaw);
      if (Number.isFinite(moq) && moq > 0 && quantity < moq) {
        throw new BadRequestException({ code: "relational_cart_quantity_below_minimum" });
      }
      minimumOrderQuantityApplied = true;
    }
    if (packRaw) {
      const pack = Number(packRaw);
      if (Number.isFinite(pack) && pack > 0) {
        const rem = quantity % pack;
        if (rem !== 0) {
          quantityRequiresReview = true;
          packSizeWarning = true;
        }
      }
    }
    return {
      quantityValidated: !quantityRequiresReview,
      quantityRequiresReview,
      minimumOrderQuantityApplied,
      packSizeWarning,
      quantityBusinessRuleNotConfigured,
    };
  }

  /** Instruction 20.6 — direct relational catalog → corridor-scoped cart (no negotiation prerequisite). */
  async addFromDirectCatalog(input: {
    relationshipId: string;
    buyerOrganizationId: string;
    sellerOrganizationId: string;
    productId: string;
    catalogId?: string | null;
    quantity: number;
    unit: string;
    actorNote?: string | null;
    actorUserId: string;
    actorOrganizationId: string;
    allowRestrictedCommerceForBackoffice?: boolean;
  }) {
    const enabled = await this.flags.isEnabled("relational_cart_direct_catalog_enabled", {
      organizationId: input.actorOrganizationId,
    });
    if (!enabled) {
      throw new ForbiddenException({ code: "relational_cart_direct_catalog_disabled" });
    }

    this.policy.assertActorParticipant(input.actorOrganizationId, input.buyerOrganizationId, input.sellerOrganizationId);

    const rel = await this.prisma.relationship.findUnique({
      where: { id: input.relationshipId },
      select: {
        id: true,
        status: true,
        requesterOrganizationId: true,
        receiverOrganizationId: true,
        upstreamOrganizationId: true,
        downstreamOrganizationId: true,
        corridorState: true,
      },
    });
    if (!rel) throw new NotFoundException(input.relationshipId);
    if (rel.status !== RelationshipStatus.ACCEPTED) {
      throw new ForbiddenException({ code: "relationship_accepted_required_for_order_conversion" });
    }
    this.assertRelationshipParties(rel, input.buyerOrganizationId, input.sellerOrganizationId);

    const allowDormant = process.env.VENEXT_DIRECT_CATALOG_ALLOW_DORMANT === "true";
    const gov = await this.assertCartGovernance(rel.id, {
      allowRestrictedCommerceForBackoffice: input.allowRestrictedCommerceForBackoffice,
      allowDormantOrderReactivation: allowDormant,
    });

    const line = await this.policy.validateLineForDirectCatalog(input.productId, {
      buyerOrganizationId: input.buyerOrganizationId,
      sellerOrganizationId: input.sellerOrganizationId,
      relationshipId: input.relationshipId,
    });
    if (input.catalogId && line.catalogId && input.catalogId !== line.catalogId) {
      throw new BadRequestException({ code: "relational_cart_catalog_id_mismatch" });
    }

    const qtyDiag = this.validateDirectCatalogQuantity(input.quantity, input.unit, line.unit);
    const lineStatus =
      line.lineValidation === "SYMBOLIC_STOCK_ONLY"
        ? RelationalCartLineValidationStatus.SYMBOLIC_STOCK_ONLY
        : qtyDiag.quantityRequiresReview
          ? RelationalCartLineValidationStatus.QUANTITY_REQUIRES_REVIEW
          : RelationalCartLineValidationStatus.VALIDATED;

    const relFull = await this.prisma.relationship.findUnique({
      where: { id: input.relationshipId },
      select: { corridorState: true },
    });
    if (!relFull) throw new NotFoundException(input.relationshipId);

    let catalogConfirmationReset = false;

    /** Instruction 20.6 / 20.7 — merge into preparation carts; confirmed carts reset on content change. */
    const mergeableStatuses: RelationalCartStatus[] = [
      RelationalCartStatus.DRAFT,
      RelationalCartStatus.READY_FOR_REVIEW,
      RelationalCartStatus.CONFIRMED_BY_BUYER,
      RelationalCartStatus.CONFIRMED_BY_SELLER,
      RelationalCartStatus.CONFIRMED_BY_BOTH_PARTIES,
    ];

    const existingCart = await this.prisma.relationalCart.findFirst({
      where: {
        buyerOrganizationId: input.buyerOrganizationId,
        sellerOrganizationId: input.sellerOrganizationId,
        relationshipId: input.relationshipId,
        sourceType: RelationalCartSourceType.MANUAL_RELATIONAL_ENTRY,
        status: { in: mergeableStatuses },
      },
      include: { items: { orderBy: { createdAt: "asc" }, take: 120 } },
    });

    const shouldResetContent =
      !!existingCart && this.needsConfirmationResetBecauseContentChanged(existingCart);
    const resetFrag = shouldResetContent ? this.confirmationResetPrismaFragment(existingCart) : {};
    const resetMeta = shouldResetContent ? this.confirmationResetMetadataPatch(existingCart) : null;
    if (shouldResetContent) catalogConfirmationReset = true;

    const qtyDec = d(input.quantity);
    const diagExtras: Record<string, unknown> = {
      directCatalogEntry: true,
      directCatalogCorridorValidated: true,
      catalogVisibilityValidated: true,
      productOwnershipValidated: true,
      quantityValidated: qtyDiag.quantityValidated,
      quantityRequiresReview: qtyDiag.quantityRequiresReview,
      minimumOrderQuantityApplied: qtyDiag.minimumOrderQuantityApplied,
      packSizeWarning: qtyDiag.packSizeWarning,
      ...(qtyDiag.quantityBusinessRuleNotConfigured ? { quantityBusinessRuleNotConfigured: true } : {}),
    };

    const baseCartMetadata: Prisma.InputJsonValue = {
      paymentExecutionDisabled: true,
      checkoutPublicDisabled: true,
      walletDebitDisabled: true,
      stockReservationDisabled: true,
      governanceWarningCodes: gov.codes,
      ...(input.actorNote ? { directCatalogActorNote: input.actorNote } : {}),
    } as Prisma.InputJsonValue;

    const matchLine = existingCart?.items.find(
      (it) =>
        it.productId === input.productId &&
        (it.catalogId ?? null) === (line.catalogId ?? null) &&
        it.unit.trim() === line.unit.trim(),
    );

    let cartId: string;
    if (existingCart && matchLine) {
      const prevQty = matchLine.quantity;
      const nextQty = prevQty.add(qtyDec);
      const prevMeta =
        typeof matchLine.metadata === "object" && matchLine.metadata ? (matchLine.metadata as Record<string, unknown>) : {};
      const lineMeta =
        typeof line.itemMetadata === "object" && line.itemMetadata ? (line.itemMetadata as Record<string, unknown>) : {};
      const hist = Array.isArray(prevMeta.directCatalogQuantityHistory)
        ? (prevMeta.directCatalogQuantityHistory as unknown[])
        : [];
      hist.push({
        quantityBefore: prevQty.toString(),
        quantityAdded: qtyDec.toString(),
        quantityAfter: nextQty.toString(),
        addedFromCatalogAt: new Date().toISOString(),
        addedByUserId: input.actorUserId,
      });
      await this.prisma.relationalCartItem.update({
        where: { id: matchLine.id },
        data: {
          quantity: nextQty,
          lineValidationStatus: lineStatus,
          metadata: {
            ...lineMeta,
            ...prevMeta,
            directCatalogQuantityHistory: hist,
          } as Prisma.InputJsonValue,
        },
      });
      await this.prisma.relationalCart.update({
        where: { id: existingCart.id },
        data: {
          ...resetFrag,
          corridorOperationalWarnings: gov.warnings as unknown as Prisma.InputJsonValue,
          corridorGovernanceValidated: gov.validated,
          metadata: (
            resetMeta
              ? { ...(resetMeta as Record<string, unknown>), ...(baseCartMetadata as object), lastDirectCatalogAddAt: new Date().toISOString() }
              : {
                  ...(typeof existingCart.metadata === "object" && existingCart.metadata ? (existingCart.metadata as object) : {}),
                  ...((baseCartMetadata as object) ?? {}),
                  lastDirectCatalogAddAt: new Date().toISOString(),
                }
          ) as Prisma.InputJsonValue,
        },
      });
      cartId = existingCart.id;
    } else if (existingCart) {
      const createdLine = await this.prisma.relationalCartItem.create({
        data: {
          cartId: existingCart.id,
          productId: input.productId,
          catalogId: line.catalogId,
          quantity: qtyDec,
          unit: line.unit,
          symbolicStockStatus: line.symbolicStockStatus,
          lineValidationStatus: lineStatus,
          metadata: {
            ...(typeof line.itemMetadata === "object" && line.itemMetadata ? (line.itemMetadata as object) : {}),
            directCatalogQuantityHistory: [
              {
                quantityBefore: "0",
                quantityAdded: qtyDec.toString(),
                quantityAfter: qtyDec.toString(),
                addedFromCatalogAt: new Date().toISOString(),
                addedByUserId: input.actorUserId,
              },
            ],
          } as Prisma.InputJsonValue,
        },
      });
      await this.prisma.relationalCart.update({
        where: { id: existingCart.id },
        data: {
          ...resetFrag,
          ...(!shouldResetContent ? { status: RelationalCartStatus.READY_FOR_REVIEW } : {}),
          corridorOperationalWarnings: gov.warnings as unknown as Prisma.InputJsonValue,
          corridorGovernanceValidated: gov.validated,
          metadata: (
            resetMeta
              ? { ...(resetMeta as Record<string, unknown>), ...(baseCartMetadata as object), lastDirectCatalogAddAt: new Date().toISOString() }
              : {
                  ...(typeof existingCart.metadata === "object" && existingCart.metadata ? (existingCart.metadata as object) : {}),
                  ...((baseCartMetadata as object) ?? {}),
                  lastDirectCatalogAddAt: new Date().toISOString(),
                }
          ) as Prisma.InputJsonValue,
        },
      });
      cartId = existingCart.id;
    } else {
      const created = await this.prisma.relationalCart.create({
        data: {
          organizationId: input.buyerOrganizationId,
          buyerOrganizationId: input.buyerOrganizationId,
          sellerOrganizationId: input.sellerOrganizationId,
          relationshipId: input.relationshipId,
          sourceType: RelationalCartSourceType.MANUAL_RELATIONAL_ENTRY,
          status: RelationalCartStatus.DRAFT,
          corridorStateAtCreation: relFull.corridorState,
          corridorGovernanceValidated: gov.validated,
          corridorOperationalWarnings: gov.warnings as unknown as Prisma.InputJsonValue,
          requiresBuyerSellerConfirmation: true,
          cartConvertibleToOrder: true,
          createdByUserId: input.actorUserId,
          metadata: baseCartMetadata,
          items: {
            create: [
              {
                productId: input.productId,
                catalogId: line.catalogId,
                quantity: qtyDec,
                unit: line.unit,
                symbolicStockStatus: line.symbolicStockStatus,
                lineValidationStatus: lineStatus,
                metadata: {
                  ...(typeof line.itemMetadata === "object" && line.itemMetadata ? (line.itemMetadata as object) : {}),
                  directCatalogQuantityHistory: [
                    {
                      quantityBefore: "0",
                      quantityAdded: qtyDec.toString(),
                      quantityAfter: qtyDec.toString(),
                      addedFromCatalogAt: new Date().toISOString(),
                      addedByUserId: input.actorUserId,
                    },
                  ],
                } as Prisma.InputJsonValue,
              },
            ],
          },
        },
      });
      cartId = created.id;
    }

    this.trustTouch?.touchOrganizations([input.buyerOrganizationId, input.sellerOrganizationId]);
    this.corridorGovernance?.touchRelationship(input.relationshipId);

    const cart = await this.loadCart(cartId);
    if (!cart) throw new NotFoundException(cartId);

    if (catalogConfirmationReset) {
      await this.publishRelationalCartBothSides(cart, "relational.cart.confirmations_reset", [
        "items",
        "status",
        "confirmationDiagnostics",
        "metadata",
      ]);
    }

    const rtEnabled = await this.flags.isEnabled("relational_cart_direct_catalog_realtime_enabled", {
      organizationId: input.actorOrganizationId,
    });
    if (rtEnabled) {
      const rtBody = {
        cartId: cart.id,
        relationshipId: cart.relationshipId,
        productId: input.productId,
        status: cart.status,
        sourceType: RelationalCartSourceType.MANUAL_RELATIONAL_ENTRY,
        changedFields: existingCart ? ["items"] : ["created", "items"],
        corridorGovernanceValidated: cart.corridorGovernanceValidated,
        paymentExecutionDisabled: true as const,
        computedAt: new Date().toISOString(),
        relationshipScoped: true as const,
        publicMarketplaceDisabled: true as const,
        checkoutPublicDisabled: true as const,
        stockReservationDisabled: true as const,
        corridorGovernanceRequired: true as const,
        heuristicOnly: true as const,
      };
      await this.realtime?.publish(input.buyerOrganizationId, "relational.cart.catalog_item_added", rtBody);
      await this.realtime?.publish(input.sellerOrganizationId, "relational.cart.catalog_item_added", rtBody);
    }

    return this.toResponse(cart, diagExtras);
  }
}
