import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  Optional,
} from "@nestjs/common";
import {
  DeliveryStatus,
  OrderDirection,
  OrderStatus,
  PaymentStatus,
  Prisma,
  RelationalCartLineValidationStatus,
  RelationalCartStatus,
  RelationshipStatus,
} from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";
import { RelationshipGovernancePolicyService } from "../relationship-governance/relationship-governance-policy.service";
import { CommercialTrustTouchService } from "../commercial-trust/commercial-trust-touch.service";
import { RelationshipGovernanceService } from "../relationship-governance/relationship-governance.service";
import { RelationalCartPolicyService } from "./relational-cart-policy.service";
import { RelationalCartRealtimePublishService } from "./relational-cart-realtime-publish.service";
import type { BackofficeCartOverrideDiagnostics } from "./resolve-backoffice-cart-override";
import { RelationalCartDiagnosticsSchema, type RelationalCartConversionResponseDto } from "@venext/shared-contracts";

/**
 * Instruction 20.5 — sole relational order materialization path for `prisma.order.create` from relational carts.
 * Instruction 20.5A — line validation, idempotent conversion, bidirectional order link metadata.
 */
@Injectable()
export class RelationalCartConversionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly policy: RelationalCartPolicyService,
    @Optional() private readonly corridorPolicy?: RelationshipGovernancePolicyService,
    @Optional() private readonly trustTouch?: CommercialTrustTouchService,
    @Optional() private readonly corridorGovernance?: RelationshipGovernanceService,
    @Optional() private readonly realtime?: RelationalCartRealtimePublishService,
  ) {}

  private baseDiagnostics() {
    return {
      relationshipScoped: true as const,
      publicMarketplaceDisabled: true as const,
      checkoutPublicDisabled: true as const,
      paymentExecutionDisabled: true as const,
      stockReservationDisabled: true as const,
      walletDebitDisabled: true as const,
      corridorGovernanceRequired: true as const,
      corridorGovernanceValidated: Boolean(this.corridorPolicy),
      corridorPolicySource: "RelationshipGovernancePolicyService.assertCorridorOperational",
      heuristicOnly: true as const,
      legacyOrderIdReturned: false as const,
      requiresCartConversionStep: true as const,
    };
  }

  private assertLinesConvertible(items: { id: string; lineValidationStatus: RelationalCartLineValidationStatus }[]) {
    const allowed = new Set<RelationalCartLineValidationStatus>([
      RelationalCartLineValidationStatus.VALIDATED,
      RelationalCartLineValidationStatus.SYMBOLIC_STOCK_ONLY,
    ]);
    const blocked: { id: string; reason: string }[] = [];
    for (const it of items) {
      if (!allowed.has(it.lineValidationStatus)) {
        blocked.push({ id: it.id, reason: it.lineValidationStatus });
      }
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

  private symbolicLineDiagnostics(items: { lineValidationStatus: RelationalCartLineValidationStatus }[]) {
    const hasSymbolic = items.some((it) => it.lineValidationStatus === RelationalCartLineValidationStatus.SYMBOLIC_STOCK_ONLY);
    if (!hasSymbolic) return {};
    return {
      stockReservationDisabled: true as const,
      stockNotReserved: true as const,
      symbolicStockOnly: true as const,
    };
  }

  async convertCartToOrder(
    cartId: string,
    actorUserId: string,
    actorOrganizationId: string,
    opts?: {
      allowRestrictedCommerceForBackoffice?: boolean;
      backofficeOverrideDiagnostics?: BackofficeCartOverrideDiagnostics;
      conversionAttemptId?: string;
    },
  ): Promise<RelationalCartConversionResponseDto> {
    void actorUserId;
    const cart = await this.prisma.relationalCart.findUnique({
      where: { id: cartId },
      include: { items: true, relationship: true },
    });
    if (!cart) throw new NotFoundException(cartId);
    this.policy.assertActorParticipant(actorOrganizationId, cart.buyerOrganizationId, cart.sellerOrganizationId);

    if (cart.convertedOrderId) {
      const diagEarly = this.mergeDiagnostics(cart, { warnings: [], governanceWarningCodes: [] }, opts?.backofficeOverrideDiagnostics, true);
      const parsedEarly = RelationalCartDiagnosticsSchema.safeParse(diagEarly);
      if (!parsedEarly.success) {
        throw new InternalServerErrorException({ code: "relational_cart_contract_validation_failed" });
      }
      return {
        orderId: cart.convertedOrderId,
        cartId: cart.id,
        conversionIdempotentReplay: true,
        diagnostics: parsedEarly.data,
      };
    }

    if (cart.status !== RelationalCartStatus.LOCKED_FOR_ORDER) {
      if (cart.status === RelationalCartStatus.CONFIRMED_BY_BOTH_PARTIES) {
        throw new BadRequestException({ code: "relational_cart_not_locked_for_order" });
      }
      throw new BadRequestException({ code: "relational_cart_not_ready_for_order_conversion" });
    }
    if (!cart.cartConvertibleToOrder || cart.conversionBlockedReason) {
      throw new ForbiddenException({ code: "relational_cart_conversion_blocked" });
    }
    if (cart.items.length === 0) {
      throw new BadRequestException({ code: "relational_cart_empty" });
    }
    if (cart.relationship.status !== RelationshipStatus.ACCEPTED) {
      throw new ForbiddenException({ code: "relationship_accepted_required_for_order_conversion" });
    }

    this.assertLinesConvertible(cart.items);

    const failClosed = process.env.NODE_ENV === "production" && process.env.VENEXT_GOVERNANCE_FAIL_CLOSED === "true";
    if (!this.corridorPolicy && failClosed) {
      throw new InternalServerErrorException({ code: "governance_dependency_missing", detail: "convert_cart_to_order" });
    }
    const govTel = { warnings: [] as string[], governanceWarningCodes: [] as string[] };
    if (this.corridorPolicy) {
      await this.corridorPolicy.assertCorridorOperational(cart.relationshipId, "order_creation", {
        governanceTelemetry: govTel,
        allowRestrictedCommerceForBackoffice: opts?.allowRestrictedCommerceForBackoffice,
      });
    }

    const currencyRow = await this.prisma.product.findUnique({
      where: { id: cart.items[0]!.productId },
      select: { currency: true },
    });
    const currency = currencyRow?.currency ?? "XOF";

    let subtotal = new Prisma.Decimal(0);
    for (const it of cart.items) {
      const negLine = cart.negotiationId
        ? await this.prisma.negotiation.findFirst({
            where: { id: cart.negotiationId, productId: it.productId },
            select: { acceptedPrice: true },
          })
        : null;
      const unitPrice =
        negLine?.acceptedPrice ??
        (await this.prisma.product.findUnique({ where: { id: it.productId }, select: { basePrice: true } }))?.basePrice;
      if (!unitPrice) throw new BadRequestException({ code: "relational_cart_line_missing_unit_price_proxy" });
      subtotal = subtotal.add(it.quantity.mul(unitPrice));
    }

    const metaBase =
      typeof cart.metadata === "object" && cart.metadata ? { ...(cart.metadata as Record<string, unknown>) } : {};
    if (opts?.conversionAttemptId) {
      metaBase.conversionAttemptId = opts.conversionAttemptId;
    }

    const orderOutcome = await this.prisma.$transaction(
      async (tx) => {
        const fresh = await tx.relationalCart.findUnique({
          where: { id: cartId },
          include: { items: true, relationship: true },
        });
        if (!fresh) throw new NotFoundException(cartId);
        if (fresh.convertedOrderId) {
          return { kind: "idempotent" as const, orderId: fresh.convertedOrderId, cartSnapshot: fresh };
        }
        if (fresh.status !== RelationalCartStatus.LOCKED_FOR_ORDER) {
          if (fresh.status === RelationalCartStatus.CONFIRMED_BY_BOTH_PARTIES) {
            throw new BadRequestException({ code: "relational_cart_not_locked_for_order" });
          }
          throw new BadRequestException({ code: "relational_cart_not_ready_for_order_conversion" });
        }
        if (!fresh.cartConvertibleToOrder || fresh.conversionBlockedReason) {
          throw new ForbiddenException({ code: "relational_cart_conversion_blocked" });
        }
        if (fresh.relationship.status !== RelationshipStatus.ACCEPTED) {
          throw new ForbiddenException({ code: "relationship_accepted_required_for_order_conversion" });
        }
        this.assertLinesConvertible(fresh.items);

        const o = await tx.order.create({
          data: {
            buyerOrganizationId: fresh.buyerOrganizationId,
            sellerOrganizationId: fresh.sellerOrganizationId,
            relationshipId: fresh.relationshipId,
            status: OrderStatus.DRAFT,
            orderDirection: OrderDirection.UPSTREAM_PURCHASE,
            totalAmount: subtotal,
            currency,
            paymentStatus: PaymentStatus.UNPAID,
            deliveryStatus: DeliveryStatus.NOT_STARTED,
            convertedFromRelationalCart: { connect: { id: fresh.id } },
          },
        });

        for (const it of fresh.items) {
          const negLine = fresh.negotiationId
            ? await tx.negotiation.findFirst({
                where: { id: fresh.negotiationId, productId: it.productId },
                select: { acceptedPrice: true },
              })
            : null;
          const unitPrice =
            negLine?.acceptedPrice ??
            (await tx.product.findUnique({ where: { id: it.productId }, select: { basePrice: true } }))?.basePrice;
          if (!unitPrice) throw new BadRequestException({ code: "relational_cart_line_missing_unit_price_proxy" });
          const lineSub = it.quantity.mul(unitPrice);
          await tx.orderItem.create({
            data: {
              orderId: o.id,
              productId: it.productId,
              quantity: it.quantity,
              unitPrice,
              negotiatedPrice: negLine?.acceptedPrice ?? undefined,
              subtotal: lineSub,
            },
          });
        }

        const upd = await tx.relationalCart.updateMany({
          where: {
            id: fresh.id,
            convertedOrderId: null,
            status: RelationalCartStatus.LOCKED_FOR_ORDER,
          },
          data: {
            status: RelationalCartStatus.CONVERTED_TO_ORDER,
            convertedOrderId: o.id,
            metadata: {
              ...metaBase,
              paymentExecutionDisabled: true,
              checkoutPublicDisabled: true,
              walletDebitDisabled: true,
              stockReservationDisabled: true,
              convertedAt: new Date().toISOString(),
            } as Prisma.InputJsonValue,
          },
        });

        if (upd.count === 0) {
          await tx.order.delete({ where: { id: o.id } }).catch(() => undefined);
          const lost = await tx.relationalCart.findUnique({
            where: { id: fresh.id },
            select: { convertedOrderId: true },
          });
          if (lost?.convertedOrderId) {
            return { kind: "idempotent" as const, orderId: lost.convertedOrderId, cartSnapshot: fresh };
          }
          throw new ConflictException({ code: "relational_cart_conversion_race" });
        }

        return { kind: "created" as const, orderId: o.id, cartSnapshot: fresh };
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable, maxWait: 5000, timeout: 15000 },
    );

    const idempotent = orderOutcome.kind === "idempotent";
    const orderId = orderOutcome.orderId;
    const snap = orderOutcome.cartSnapshot;

    this.trustTouch?.touchOrganizations([snap.buyerOrganizationId, snap.sellerOrganizationId]);
    this.corridorGovernance?.touchRelationship(snap.relationshipId);

    const diagnosticsRaw = this.mergeDiagnostics(snap, govTel, opts?.backofficeOverrideDiagnostics, idempotent);
    const diagParsed = RelationalCartDiagnosticsSchema.safeParse(diagnosticsRaw);
    if (!diagParsed.success) {
      throw new InternalServerErrorException({ code: "relational_cart_contract_validation_failed" });
    }

    const realtimeBody = {
      cartId: snap.id,
      relationshipId: snap.relationshipId,
      status: RelationalCartStatus.CONVERTED_TO_ORDER,
      sourceType: snap.sourceType,
      changedFields: ["status", "convertedOrderId"],
      corridorGovernanceValidated: diagnosticsRaw.corridorGovernanceValidated,
      paymentExecutionDisabled: true as const,
      computedAt: new Date().toISOString(),
      relationshipScoped: true as const,
      publicMarketplaceDisabled: true as const,
      checkoutPublicDisabled: true as const,
      stockReservationDisabled: true as const,
      corridorGovernanceRequired: true as const,
      heuristicOnly: true as const,
    };
    if (!idempotent) {
      await this.realtime?.publish(snap.buyerOrganizationId, "relational.cart.converted_to_order", realtimeBody);
      await this.realtime?.publish(snap.sellerOrganizationId, "relational.cart.converted_to_order", realtimeBody);
    }

    return {
      orderId,
      cartId: snap.id,
      conversionIdempotentReplay: idempotent ? true : undefined,
      diagnostics: diagParsed.data,
    };
  }

  private mergeDiagnostics(
    cart: {
      corridorGovernanceValidated: boolean;
      corridorStateAtCreation: unknown;
      corridorOperationalWarnings: Prisma.JsonValue;
      items: { lineValidationStatus: RelationalCartLineValidationStatus }[];
    },
    govTel: { warnings: string[]; governanceWarningCodes?: string[] },
    override?: BackofficeCartOverrideDiagnostics,
    idempotent?: boolean,
  ) {
    const w =
      govTel.warnings.length > 0
        ? govTel.warnings
        : Array.isArray(cart.corridorOperationalWarnings)
          ? (cart.corridorOperationalWarnings as unknown[]).filter((x): x is string => typeof x === "string")
          : [];
    return {
      ...this.baseDiagnostics(),
      corridorGovernanceValidated: cart.corridorGovernanceValidated,
      corridorOperationalWarnings: w,
      corridorStateAtCreation: String(cart.corridorStateAtCreation),
      ...this.symbolicLineDiagnostics(cart.items),
      ...(override ?? {}),
      ...(idempotent ? { conversionIdempotentReplay: true as const } : {}),
    };
  }
}
