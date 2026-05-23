import { Injectable } from "@nestjs/common";
import { OrderStatus, PaymentStatus, TransactionStatus } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";
import { decToNumber } from "./finance-metrics.util";

export type FinanceOrderSnapshot = {
  id: string;
  buyerOrganizationId: string;
  relationshipId: string;
  totalAmount: number;
  currency: string;
  paymentStatus: PaymentStatus;
  status: OrderStatus;
  deliveryStatus: string;
  createdAt: Date;
  updatedAt: Date;
  buyer: {
    id: string;
    displayName: string;
    city: string;
    country: string;
    credibilityScore: number;
    category: string;
  };
  relationship: {
    id: string;
    trustLevel: number;
    status: string;
  };
};

export type FinanceNegotiationSnapshot = {
  id: string;
  buyerOrganizationId: string;
  proposedPaymentMode: string | null;
  acceptedPaymentMode: string | null;
  status: string;
};

export type FinanceWalletSnapshot = {
  organizationId: string;
  currency: string;
  balance: number;
  status: string;
  qrPayload: string;
  nfcEnabled: boolean;
};

export type FinanceTxnSnapshot = {
  id: string;
  organizationId: string;
  walletId: string;
  type: string;
  amount: number;
  currency: string;
  status: TransactionStatus;
  createdAt: Date;
};

export type FinanceGroupBuySnapshot = {
  id: string;
  relationshipId: string | null;
  currentQuantity: number;
  targetQuantity: number;
  participantCount: number;
  status: string;
  expiresAt: Date;
};

export type FinanceCollectionsSnapshot = {
  organizationId: string;
  generatedAt: string;
  orders: FinanceOrderSnapshot[];
  negotiations: FinanceNegotiationSnapshot[];
  wallets: FinanceWalletSnapshot[];
  transactions: FinanceTxnSnapshot[];
  groupBuyingSessions: FinanceGroupBuySnapshot[];
};

@Injectable()
export class FinanceCollectionsDataService {
  constructor(private readonly prisma: PrismaService) {}

  async loadSnapshot(organizationId: string): Promise<FinanceCollectionsSnapshot> {
    const generatedAt = new Date().toISOString();
    const since = new Date(Date.now() - 30 * 86400000);

    const orders = await this.prisma.order.findMany({
      where: {
        sellerOrganizationId: organizationId,
        status: { notIn: [OrderStatus.DRAFT, OrderStatus.CANCELLED, OrderStatus.REJECTED] },
      },
      orderBy: { updatedAt: "desc" },
      take: 200,
      select: {
        id: true,
        buyerOrganizationId: true,
        relationshipId: true,
        totalAmount: true,
        currency: true,
        paymentStatus: true,
        status: true,
        deliveryStatus: true,
        createdAt: true,
        updatedAt: true,
        buyer: {
          select: {
            id: true,
            displayName: true,
            city: true,
            country: true,
            credibilityScore: true,
            category: true,
          },
        },
        relationship: {
          select: { id: true, trustLevel: true, status: true },
        },
      },
    });

    const buyerIds = [...new Set(orders.map((o) => o.buyerOrganizationId))];

    const [negotiations, sellerWallets, buyerWallets, groupBuyingSessions] = await Promise.all([
      this.prisma.negotiation.findMany({
        where: {
          sellerOrganizationId: organizationId,
          status: { in: ["OPEN", "PROPOSED"] },
        },
        take: 80,
        select: {
          id: true,
          buyerOrganizationId: true,
          proposedPaymentMode: true,
          acceptedPaymentMode: true,
          status: true,
        },
      }),
      this.prisma.wallet.findMany({
        where: { organizationId },
        select: {
          organizationId: true,
          currency: true,
          balance: true,
          status: true,
          qrPayload: true,
          nfcEnabled: true,
        },
      }),
      buyerIds.length
        ? this.prisma.wallet.findMany({
            where: { organizationId: { in: buyerIds } },
            select: {
              organizationId: true,
              currency: true,
              balance: true,
              status: true,
              qrPayload: true,
              nfcEnabled: true,
            },
          })
        : Promise.resolve([]),
      this.prisma.groupBuyingSession.findMany({
        where: {
          OR: [
            { initiatorOrganizationId: organizationId },
            {
              relationship: {
                OR: [
                  { upstreamOrganizationId: organizationId },
                  { downstreamOrganizationId: organizationId },
                  { requesterOrganizationId: organizationId },
                  { receiverOrganizationId: organizationId },
                ],
              },
            },
          ],
        },
        take: 40,
        select: {
          id: true,
          relationshipId: true,
          currentQuantity: true,
          targetQuantity: true,
          participantCount: true,
          status: true,
          expiresAt: true,
        },
      }),
    ]);

    const wallets = [...sellerWallets, ...buyerWallets];

    const transactions = await this.prisma.transaction.findMany({
      where: {
        createdAt: { gte: since },
        organizationId: { in: [organizationId, ...buyerIds] },
      },
      orderBy: { createdAt: "desc" },
      take: 400,
      select: {
        id: true,
        organizationId: true,
        walletId: true,
        type: true,
        amount: true,
        currency: true,
        status: true,
        createdAt: true,
      },
    });

    return {
      organizationId,
      generatedAt,
      orders: orders.map((o) => ({
        id: o.id,
        buyerOrganizationId: o.buyerOrganizationId,
        relationshipId: o.relationshipId,
        totalAmount: decToNumber(o.totalAmount),
        currency: o.currency,
        paymentStatus: o.paymentStatus,
        status: o.status,
        deliveryStatus: String(o.deliveryStatus),
        createdAt: o.createdAt,
        updatedAt: o.updatedAt,
        buyer: {
          id: o.buyer.id,
          displayName: o.buyer.displayName,
          city: o.buyer.city,
          country: o.buyer.country,
          credibilityScore: o.buyer.credibilityScore,
          category: o.buyer.category,
        },
        relationship: {
          id: o.relationship.id,
          trustLevel: o.relationship.trustLevel,
          status: String(o.relationship.status),
        },
      })),
      negotiations: negotiations.map((n) => ({
        id: n.id,
        buyerOrganizationId: n.buyerOrganizationId,
        proposedPaymentMode: n.proposedPaymentMode,
        acceptedPaymentMode: n.acceptedPaymentMode,
        status: n.status,
      })),
      wallets: wallets.map((w) => ({
        organizationId: w.organizationId,
        currency: w.currency,
        balance: decToNumber(w.balance),
        status: String(w.status),
        qrPayload: w.qrPayload,
        nfcEnabled: w.nfcEnabled,
      })),
      transactions: transactions.map((t) => ({
        id: t.id,
        organizationId: t.organizationId,
        walletId: t.walletId,
        type: t.type,
        amount: decToNumber(t.amount),
        currency: t.currency,
        status: t.status,
        createdAt: t.createdAt,
      })),
      groupBuyingSessions: groupBuyingSessions.map((g) => ({
        id: g.id,
        relationshipId: g.relationshipId,
        currentQuantity: decToNumber(g.currentQuantity),
        targetQuantity: decToNumber(g.targetQuantity),
        participantCount: g.participantCount,
        status: g.status,
        expiresAt: g.expiresAt,
      })),
    };
  }
}
