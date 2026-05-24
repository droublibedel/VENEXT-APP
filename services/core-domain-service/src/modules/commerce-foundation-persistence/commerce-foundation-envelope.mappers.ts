import { Injectable, NotFoundException } from "@nestjs/common";

import { commerceFoundationUxError } from "./commerce-foundation.errors";
import { CommerceFoundationService } from "./commerce-foundation.service";
import {
  DEMO_ORG_GROSSISTE_A,
  DEMO_ORG_PRODUCER,
} from "./demo/commerce-foundation-demo.seed";

function envelope<T>(payload: T) {
  return { dataSource: "live" as const, fallbackUsed: false, payload };
}

@Injectable()
export class CommerceFoundationEnvelopeMappers {
  constructor(private readonly foundation: CommerceFoundationService) {}

  async mapGrossisteB(endpoint: string, organizationId: string) {
    switch (endpoint) {
      case "catalog": {
        const catalogs = await this.foundation.catalogs.listCatalogs({ organizationId, limit: 5 });
        const products = catalogs.flatMap((c) => (Array.isArray(c.products) ? c.products : []));
        return envelope({
          organizationId,
          products,
          popularIds: products.slice(0, 2).map((p) => (p as { id: string }).id),
          promotions: [],
        });
      }
      case "orders": {
        const orders = await this.foundation.orders.listOrders({ organizationId, limit: 20 });
        return envelope({
          organizationId,
          received: orders.filter((o) => o.sellerActorId === organizationId),
          sent: orders.filter((o) => o.buyerActorId === organizationId),
        });
      }
      case "network": {
        const rels = await this.foundation.relationships.listForOrganization(organizationId);
        return envelope({
          organizationId,
          recentPartners: rels.map((r) => ({
            id: r.id,
            name: r.actorAId === organizationId ? r.actorBId : r.actorAId,
            type: r.relationshipType,
            city: "Abidjan",
            lastActive: "Aujourd'hui",
          })),
        });
      }
      case "activity":
        return envelope({
          organizationId,
          networkActivityToday: 12,
          newOrdersCount: 3,
          activePartners: 5,
          movingProducts: [],
          simpleAlerts: [],
          activeCities: ["Abidjan"],
          discreetTrends: [],
        });
      default:
        throw new NotFoundException(commerceFoundationUxError("contextUnavailable"));
    }
  }

  async mapDetaillant(endpoint: string, organizationId: string) {
    if (endpoint === "home") {
      const rels = await this.foundation.relationships.listForOrganization(organizationId);
      const orders = await this.foundation.orders.listOrders({ organizationId, limit: 5 });
      return envelope({
        organizationId,
        activityToday: rels.length * 2,
        salesTodayLabel: "—",
        popularProducts: [],
        recentOrders: orders.slice(0, 3).map((o) => ({
          id: String(o.id),
          partner: String(o.sellerActorId === organizationId ? o.buyerActorId : o.sellerActorId),
          amountLabel: `${o.totalAmount ?? 0} FCFA`,
          status: String(o.status ?? "en-cours"),
        })),
        simpleAlerts: [],
        activePartners: rels.length,
        discreetSuggestions: [],
      });
    }
    if (endpoint === "products") {
      const catalogs = await this.foundation.catalogs.listCatalogs({ organizationId, limit: 5 });
      const products = catalogs.flatMap((c) => (Array.isArray(c.products) ? c.products : []));
      return envelope({ organizationId, products, popularIds: [], promotions: [] });
    }
    if (endpoint === "orders") {
      const orders = await this.foundation.orders.listOrders({ organizationId, limit: 20 });
      const rows = orders.map((o) => ({
        id: String(o.id),
        partner: String(o.sellerActorId === organizationId ? o.buyerActorId : o.sellerActorId),
        city: "Abidjan",
        status: o.status === "in_delivery" ? "livraison" : o.status === "completed" ? "terminee" : "en-cours",
        items: Array.isArray(o.lines) ? o.lines.length : 0,
        amountLabel: `${o.totalAmount ?? 0} FCFA`,
        updatedAt: String(o.updatedAt ?? new Date().toISOString()),
      }));
      return envelope({
        organizationId,
        enCours: rows.filter((r) => r.status === "en-cours" || r.status === "livraison"),
        recues: rows.filter((r) => r.status === "recue"),
        terminees: rows.filter((r) => r.status === "terminee"),
      });
    }
    if (endpoint === "network") {
      const rels = await this.foundation.relationships.listForOrganization(organizationId);
      return envelope({
        organizationId,
        activeSuppliers: rels.map((r) => ({
          id: String(r.id),
          name: String(r.actorAId === organizationId ? r.actorBId : r.actorAId),
          type: String(r.relationshipType ?? "partenaire"),
          city: "Abidjan",
        })),
        newPartners: [],
        cityActivity: [],
        trendingProducts: [],
        networkSuggestions: [],
      });
    }
    throw new NotFoundException(commerceFoundationUxError("contextUnavailable"));
  }

  async mapProducer(endpoint: string, organizationId: string) {
    switch (endpoint) {
      case "catalog": {
        const catalogs = await this.foundation.catalogs.listCatalogs({ organizationId, limit: 10 });
        const products = catalogs.flatMap((c) => (Array.isArray(c.products) ? c.products : []));
        return envelope({ organizationId, products, partnerCatalogs: catalogs.length });
      }
      case "orders": {
        const orders = await this.foundation.orders.listOrders({ organizationId, limit: 30 });
        return envelope({
          organizationId,
          orders: orders.filter(
            (o) => o.buyerActorId === organizationId || o.sellerActorId === organizationId,
          ),
        });
      }
      case "deliveries": {
        const rels = await this.foundation.relationships.listForOrganization(organizationId);
        const relIds = new Set(rels.map((r) => r.id as string));
        const deliveries = await this.foundation.deliveries.listDeliveries({ limit: 50 });
        return envelope({
          organizationId,
          deliveries: deliveries.filter((d) => relIds.has(d.relationshipId as string)),
        });
      }
      case "mail": {
        const rels = await this.foundation.relationships.listForOrganization(organizationId);
        const relIds = new Set(rels.map((r) => r.id as string));
        const threads = await this.foundation.mail.listThreads({ limit: 30 });
        return envelope({
          organizationId,
          threads: threads.filter((t) => relIds.has(t.relationshipId as string)),
        });
      }
      case "relationships":
        return envelope({
          organizationId,
          relationships: await this.foundation.relationships.listForOrganization(organizationId),
        });
      default:
        throw new NotFoundException(commerceFoundationUxError("contextUnavailable"));
    }
  }

  async mapGrossisteA(endpoint: string, organizationId: string) {
    const org = organizationId || DEMO_ORG_GROSSISTE_A;
    switch (endpoint) {
      case "catalog": {
        const catalogs = await this.foundation.catalogs.listCatalogs({ organizationId: org, limit: 10 });
        const products = catalogs.flatMap((c) => (Array.isArray(c.products) ? c.products : []));
        return envelope({ organizationId: org, products });
      }
      case "orders": {
        const orders = await this.foundation.orders.listOrders({ organizationId: org, limit: 30 });
        const rows = orders
          .filter((o) => o.sellerActorId === org || o.buyerActorId === org)
          .map((o) => ({
            id: o.id,
            partner: o.buyerActorId === org ? o.sellerActorId : o.buyerActorId,
            city: "Bouaké",
            status: o.status === "in_delivery" ? "livraison" : "validation",
            items: Array.isArray(o.lines) ? o.lines.length : 0,
            amountLabel: `${o.totalAmount} FCFA`,
            updatedAt: o.updatedAt,
          }));
        return envelope({ organizationId: org, enCours: rows, recent: rows.slice(0, 5) });
      }
      case "settlements": {
        const settlements = await this.foundation.settlements.listSettlements({ organizationId: org, limit: 20 });
        return envelope({ organizationId: org, settlements });
      }
      case "messaging": {
        const rels = await this.foundation.relationships.listForOrganization(org);
        const relIds = new Set(rels.map((r) => r.id as string));
        const threads = await this.foundation.messaging.listThreads({ limit: 30 });
        return envelope({
          organizationId: org,
          conversations: threads.filter((t) => relIds.has(t.relationshipId as string)),
        });
      }
      case "distribution":
      case "territory": {
        const relsTerritory = await this.foundation.relationships.listForOrganization(org);
        return envelope({
          organizationId: org,
          map: { regions: [], corridors: [] },
          activeCorridors: [{ id: "c1", label: "Abidjan — Bouaké", level: "stable" }],
          distributionTensions: [],
          activeCities: ["Abidjan", "Bouaké"],
          flowStability: "Stable",
          dynamicHubs: ["Bouaké centre"],
          cityActivity: [{ city: "Bouaké", level: "high", growth: "+4%" }],
          growthZones: ["Bouaké nord"],
          slowZones: [],
          corridorActivity: [{ id: "c1", label: "Abidjan — Bouaké" }],
          regionalPartners: relsTerritory.slice(0, 5).map((r) => ({
            id: r.id,
            name: r.actorAId === org ? String(r.actorBId) : String(r.actorAId),
            city: "Bouaké",
          })),
        });
      }
      case "overview": {
        const rels = await this.foundation.relationships.listForOrganization(org);
        return envelope({
          organizationId: org,
          activityToday: rels.length * 2,
          activeOrders: 2,
          activePartners: rels.length,
          dynamicCities: ["Bouaké", "Abidjan"],
          movingProducts: [],
          networkStability: "Stable",
          simpleAlerts: [],
          visibleTrends: [],
        });
      }
      case "network": {
        const rels = await this.foundation.relationships.listForOrganization(org);
        return envelope({
          organizationId: org,
          activePartners: rels.map((r) => ({
            id: r.id,
            name: r.actorAId === org ? r.actorBId : r.actorAId,
            type: r.relationshipType,
            city: "Bouaké",
            orders7d: 3,
          })),
          secondaryWholesalers: [],
          activeRetailers: [],
          strongZones: ["Bouaké"],
          weakZones: [],
          networkActivity: "Actif",
          suggestions: [],
        });
      }
      case "finance":
        return envelope({
          organizationId: org,
          collectionStability: "Bonne",
          financialActivity: "Modérée",
          reliablePartners: [],
          tensionZones: [],
          revenueCoverage: "Réseau fermé",
        });
      case "intelligence":
        return envelope({
          organizationId: org,
          activitySignals: [],
          watchZones: [],
          dynamicProducts: [],
          activePartners: [],
          suggestions: [],
          anomalies: [],
        });
      default:
        throw new NotFoundException(commerceFoundationUxError("contextUnavailable"));
    }
  }

  async mapWallet(endpoint: string, organizationId: string) {
    const wallet = await this.foundation.getByKey<Record<string, unknown>>("WalletDemoState", organizationId);
    if (!wallet) throw new NotFoundException(commerceFoundationUxError("walletNotActivated"));
    switch (endpoint) {
      case "balance":
        return envelope({ availableLabel: wallet.availableLabel, currency: "XOF", demo: true });
      case "transactions":
        return envelope(wallet.transactions ?? []);
      case "payments":
        return envelope([]);
      case "activity":
        return envelope([]);
      default:
        throw new NotFoundException(commerceFoundationUxError("contextUnavailable"));
    }
  }
}
