import type {
  CommerceConversation,
  CommerceMessage,
  CommerceMessagingInjectedData,
  CommerceNetworkStrip,
  CommerceOrderContext,
  CommerceProductContext,
} from "commerce-messaging";
import { buildLinkedContextForConversation } from "commerce-messaging";

import type {
  GrossisteAIntelligenceDto,
  GrossisteANetworkDto,
  GrossisteAOrdersDto,
  GrossisteAOverviewDto,
  GrossisteADataSource,
  GrossisteAProduct,
} from "../../hooks/grossiste-a-data.types";
import { buildGrossisteAGovernanceBundle, grossisteAOrderGovernance } from "./grossiste-a-conversation-governance";
import { grossisteAProductConversationSettings } from "./grossiste-a-product-conversation-settings";
import {
  buildGrossisteConversationSignals,
  buildGrossisteCorridorHint,
  buildGrossisteOrderHints,
  buildGrossistePartnerHints,
  buildGrossisteProductDemandHint,
  GROSSISTE_A_QUICK_SUGGESTIONS,
} from "./grossiste-a-messaging-intelligence";

export type GrossisteAMessagingSource = {
  overview: GrossisteAOverviewDto | null;
  network: GrossisteANetworkDto | null;
  orders: GrossisteAOrdersDto | null;
  intelligence: GrossisteAIntelligenceDto | null;
  catalogProducts?: GrossisteAProduct[];
  governanceEnabled?: boolean;
  linkedContextEnabled?: boolean;
  linkedTimelineEnabled?: boolean;
  dataSource: GrossisteADataSource;
  fallbackUsed: boolean;
  loading: boolean;
  onRefresh: () => void;
};

type ConvMeta = {
  conversation: CommerceConversation;
  productName?: string;
  orderId?: string;
  productId?: string;
};

const STATUS_LABEL: Record<string, string> = {
  validation: "À valider",
  preparation: "En préparation",
  livraison: "En livraison",
  retard: "Légèrement en retard",
};

function orderActivityStatus(status: string): string {
  return STATUS_LABEL[status] ?? status;
}

function buildMetaList(source: GrossisteAMessagingSource): ConvMeta[] {
  const { network, orders, overview } = source;
  const metas: ConvMeta[] = [];
  const orderRows = [...(orders?.enCours ?? []), ...(orders?.recent ?? [])];

  for (const p of network?.activePartners ?? []) {
    const linked = orderRows.find((o) => o.partner === p.name);
    const product = overview?.movingProducts[0];
    metas.push({
      conversation: {
        id: `ga-msg-${p.id}`,
        category: linked ? "commandes" : "reseau",
        partnerName: p.name,
        partnerId: p.id,
        partnerRole: p.type,
        recentActivity: linked
          ? `${orderActivityStatus(linked.status)} — ${linked.amountLabel}`
          : `${p.orders7d} commandes / 7j`,
        productName: product?.name,
        activityStatus: linked ? orderActivityStatus(linked.status) : "Partenaire actif",
        needsReply: linked?.status === "validation",
        city: p.city,
        corridor: overview?.simpleAlerts.find((a) => a.text.includes("Corridor"))?.text.includes("nord")
          ? "Axe nord"
          : undefined,
        linkedOrderId: linked?.id,
        linkedOrderLabel: linked?.amountLabel,
      },
      productName: product?.name,
      orderId: linked?.id,
      productId: product?.id,
    });
  }

  for (const o of orderRows) {
    if (metas.some((m) => m.conversation.partnerName === o.partner)) continue;
    const product = overview?.movingProducts[0];
    metas.push({
      conversation: {
        id: `ga-msg-order-${o.id}`,
        category: "commandes",
        partnerName: o.partner,
        partnerId: `order-${o.id}`,
        partnerRole: "partenaire",
        recentActivity: `${orderActivityStatus(o.status)} · ${o.updatedAt}`,
        productName: product?.name,
        activityStatus: orderActivityStatus(o.status),
        needsReply: o.status === "validation" || o.status === "retard",
        city: o.city,
        linkedOrderId: o.id,
        linkedOrderLabel: o.amountLabel,
      },
      productName: product?.name,
      orderId: o.id,
      productId: product?.id,
    });
  }

  if (overview?.movingProducts.length) {
    const p = overview.movingProducts[0]!;
    if (!metas.some((m) => m.productName === p.name)) {
      metas.push({
        conversation: {
          id: `ga-msg-product-${p.id}`,
          category: "produits",
          partnerName: network?.activePartners[0]?.name ?? "Réseau",
          partnerId: network?.activePartners[0]?.id ?? "reseau",
          partnerRole: "produit",
          recentActivity: `Demande sur ${p.name}`,
          productName: p.name,
          activityStatus: "Forte demande",
          needsReply: false,
          city: overview.dynamicCities[0] ?? "Abidjan",
        },
        productName: p.name,
        productId: p.id,
      });
    }
  }

  if (network?.suggestions.length) {
    metas.push({
      conversation: {
        id: "ga-msg-terrain",
        category: "activite-terrain",
        partnerName: "Terrain réseau",
        partnerRole: "activité",
        recentActivity: network.suggestions[0] ?? "Activité terrain",
        activityStatus: network.networkActivity,
        needsReply: false,
        city: overview?.dynamicCities[0] ?? "Abidjan",
        corridor: "Corridor actif",
      },
    });
  }

  return metas;
}

function buildMessagesFor(meta: ConvMeta): CommerceMessage[] {
  const { conversation: c } = meta;
  const msgs: CommerceMessage[] = [
    {
      id: `${c.id}-m1`,
      conversationId: c.id,
      kind: "text",
      author: "partner",
      text: `Bonjour — suivi ${c.productName ? `pour ${c.productName}` : "commercial"}.`,
      at: "08:10",
    },
  ];
  if (meta.productName) {
    msgs.push({
      id: `${c.id}-m2`,
      conversationId: c.id,
      kind: "product",
      author: "partner",
      text: "Produit concerné",
      at: "08:12",
      productId: meta.productId,
      attachmentLabel: `${meta.productName} — forte demande`,
    });
  }
  if (meta.orderId) {
    msgs.push({
      id: `${c.id}-m3`,
      conversationId: c.id,
      kind: "order",
      author: "self",
      text: "Commande liée",
      at: "08:18",
      orderId: meta.orderId,
      attachmentLabel: c.linkedOrderLabel ?? "Commande en cours",
    });
  }
  msgs.push({
    id: `${c.id}-m4`,
    conversationId: c.id,
    kind: "activity",
    author: "partner",
    text: `${c.city} — activité partenaire visible sur le réseau.`,
    at: "08:22",
  });
  return msgs;
}

function productContext(
  meta: ConvMeta,
  catalogProducts: GrossisteAProduct[],
): CommerceProductContext | null {
  if (!meta.productName) return null;
  const catalog = catalogProducts.find((p) => p.id === meta.productId);
  const settings = catalog
    ? grossisteAProductConversationSettings(catalog)
    : null;
  return {
    productId: meta.productId ?? "pr",
    name: meta.productName,
    availability: "Disponible — suivi réseau Grossiste A",
    recentActivity: settings?.conversationEnabled
      ? "Discussions actives aujourd'hui"
      : "Commandes sans discussion",
    demand: "Forte demande",
    networkStatus: "Réseau actif",
    city: meta.conversation.city,
    conversationEnabled: settings?.conversationEnabled,
    conversationMode: settings?.conversationMode,
  };
}

function orderContext(meta: ConvMeta, orders: GrossisteAOrdersDto | null): CommerceOrderContext | null {
  if (!meta.orderId || !orders) return null;
  const row = [...orders.enCours, ...orders.recent].find((o) => o.id === meta.orderId);
  if (!row) return null;
  return {
    orderId: row.id,
    partner: row.partner,
    status: orderActivityStatus(row.status),
    preparation: row.status === "preparation" ? "En cours" : "—",
    delivery: row.status === "livraison" ? "En cours" : "Planifiée",
    lateNote: row.status === "retard" ? "Légèrement en retard" : undefined,
    amountLabel: row.amountLabel,
    conversationScope: grossisteAOrderGovernance(row).scope,
  };
}

export function buildGrossisteAMessagingInjected(
  source: GrossisteAMessagingSource,
): CommerceMessagingInjectedData {
  const catalogProducts = source.catalogProducts ?? [];
  const governanceBundle = source.governanceEnabled
    ? buildGrossisteAGovernanceBundle({
        network: source.network,
        catalogProducts,
        governanceEnabled: true,
      })
    : null;

  const metas = buildMetaList(source);
  if (governanceBundle) {
    for (const m of metas) {
      const orderRow =
        m.orderId && source.orders
          ? [...source.orders.enCours, ...source.orders.recent].find((o) => o.id === m.orderId)
          : null;
      const resolved = governanceBundle.resolveForConversation({
        conversationId: m.conversation.id,
        partnerId: m.conversation.partnerId,
        productId: m.productId,
        order: orderRow ?? null,
      });
      m.conversation.conversationMode = resolved.mode;
    }
  }
  const byId = new Map(metas.map((m) => [m.conversation.id, m]));

  const extraHints = [
    ...buildGrossisteConversationSignals(source.overview, source.intelligence),
    ...buildGrossistePartnerHints(source.network),
    ...buildGrossisteOrderHints(source.orders),
  ];

  const firstCorridor = metas.find((m) => m.conversation.corridor)?.conversation.corridor;
  const corridorHint = buildGrossisteCorridorHint(firstCorridor);
  if (corridorHint) extraHints.push(corridorHint);

  return {
    conversations: metas.map((m) => m.conversation),
    getMessages: (id: string) => {
      const meta = byId.get(id);
      return meta ? buildMessagesFor(meta) : [];
    },
    getProductContext: (id: string) => {
      const meta = byId.get(id);
      return meta ? productContext(meta, catalogProducts) : null;
    },
    getProductConversationSettings: (id: string) => {
      const meta = byId.get(id);
      if (!meta?.productId || !governanceBundle) return null;
      return governanceBundle.productMap.get(meta.productId) ?? null;
    },
    getOrderConversationGovernance: (id: string) => {
      const meta = byId.get(id);
      if (!meta?.orderId || !source.orders || !governanceBundle) return null;
      const row = [...source.orders.enCours, ...source.orders.recent].find((o) => o.id === meta.orderId);
      return row ? grossisteAOrderGovernance(row) : null;
    },
    resolveConversationGovernance: governanceBundle
      ? (id: string) => {
          const meta = byId.get(id);
          const orderRow = meta?.orderId
            ? [...(source.orders?.enCours ?? []), ...(source.orders?.recent ?? [])].find(
                (o) => o.id === meta.orderId,
              )
            : null;
          return governanceBundle.resolveForConversation({
            conversationId: id,
            partnerId: meta?.conversation.partnerId,
            productId: meta?.productId,
            order: orderRow ?? null,
          });
        }
      : undefined,
    governanceEnabled: source.governanceEnabled,
    accountSettings: governanceBundle?.account,
    getOrderContext: (id: string) => {
      const meta = byId.get(id);
      return meta ? orderContext(meta, source.orders) : null;
    },
    getNetworkStrip: (id: string): CommerceNetworkStrip | null => {
      const meta = byId.get(id);
      if (!meta) return null;
      return {
        corridor: meta.conversation.corridor,
        activeCity: meta.conversation.city,
        demandedProduct: meta.productName,
        activePartner: meta.conversation.partnerName,
      };
    },
    extraHints,
    quickSuggestions: GROSSISTE_A_QUICK_SUGGESTIONS,
    dataSource: source.dataSource,
    fallbackUsed: source.fallbackUsed,
    loading: source.loading,
    onRefresh: source.onRefresh,
    linkedContextEnabled: source.linkedContextEnabled,
    linkedTimelineEnabled: source.linkedTimelineEnabled,
    getLinkedContext: (id: string) => {
      const meta = byId.get(id);
      if (!meta) return null;
      return buildLinkedContextForConversation({
        conversation: meta.conversation,
        order: orderContext(meta, source.orders),
      });
    },
  };
}
