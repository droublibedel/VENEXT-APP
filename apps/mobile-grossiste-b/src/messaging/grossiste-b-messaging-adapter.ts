import {
  defaultCommerceAccountSettings,
  resolveConversationGovernance,
  type CommerceConversation,
  type CommerceMessage,
  type CommerceMessagingAccountSettings,
  type CommerceMessagingInjectedData,
  type CommerceNetworkStrip,
  type CommerceOrderContext,
  type CommerceOrderConversationGovernance,
  type CommerceProductContext,
  type CommerceProductConversationSettings,
  type ResolvedConversationGovernance,
  buildLinkedContextForConversation,
} from "commerce-messaging";

import type {
  GrossisteActivityDto,
  GrossisteCatalogDto,
  GrossisteCatalogProduct,
  GrossisteDataSource,
  GrossisteNetworkDto,
  GrossisteOrderRow,
  GrossisteOrdersDto,
} from "../hooks/grossiste-b-data.types";
import { resolveTerrainPartnerDisplayName } from "commercial-network-discovery";

import {
  buildGrossisteBConversationHints,
  buildGrossisteBDemandSignals,
  buildGrossisteBOrderHints,
  buildGrossisteBPartnerSignals,
  GROSSISTE_B_QUICK_SUGGESTIONS,
} from "./grossiste-b-messaging-intelligence";

/** Noms locaux carnet — jamais exposés au partenaire distant. */
const GROSSISTE_B_LOCAL_CONTACTS: Record<string, string> = {
  pt1: "Client Plateau",
  pt4: "Dépôt San Pedro",
};

function terrainPartnerDisplayName(partnerId: string, businessName: string, city?: string): string {
  return resolveTerrainPartnerDisplayName({
    partnerId,
    phone: "+2250700000000",
    localContactName: GROSSISTE_B_LOCAL_CONTACTS[partnerId],
    registeredBusinessName: businessName,
    city,
    actorRole: "grossiste_b",
  }).displayName;
}

export type GrossisteBMessagingSource = {
  activity: GrossisteActivityDto | null;
  catalog: GrossisteCatalogDto | null;
  orders: GrossisteOrdersDto | null;
  network: GrossisteNetworkDto | null;
  governanceEnabled?: boolean;
  linkedContextEnabled?: boolean;
  linkedTimelineEnabled?: boolean;
  dataSource: GrossisteDataSource;
  fallbackUsed: boolean;
  loading: boolean;
  onRefresh: () => void;
};

type ConvMeta = {
  conversation: CommerceConversation;
  productName?: string;
  orderId?: string;
  productId?: string;
  partnerType?: string;
};

const STATUS_LABEL: Record<string, string> = {
  preparation: "En préparation",
  validation: "À valider",
  delivery: "En livraison",
  done: "Terminée",
};

function orderActivityStatus(status: string): string {
  return STATUS_LABEL[status] ?? status;
}

function grossisteBProductConversationSettings(
  product: GrossisteCatalogProduct,
): CommerceProductConversationSettings {
  if (product.availability === "out") {
    return {
      productId: product.id,
      conversationEnabled: false,
      conversationMode: "DISABLED",
    };
  }
  if (product.availability === "limited" || product.badge === "stock-limite") {
    return {
      productId: product.id,
      conversationEnabled: true,
      conversationMode: "FIXED_PRICE_ONLY",
    };
  }
  return {
    productId: product.id,
    conversationEnabled: true,
    conversationMode: "NEGOTIABLE",
  };
}

function grossisteBProductSettingsById(
  products: GrossisteCatalogProduct[],
): Map<string, CommerceProductConversationSettings> {
  const map = new Map<string, CommerceProductConversationSettings>();
  for (const p of products) {
    map.set(p.id, grossisteBProductConversationSettings(p));
  }
  return map;
}

function buildGrossisteBAccountSettings(
  network: GrossisteNetworkDto | null,
): CommerceMessagingAccountSettings {
  const base = defaultCommerceAccountSettings();
  return {
    ...base,
    messagingEnabled: true,
    defaultMode: "NEGOTIABLE",
    partnersOnly: false,
    authorizedPartnerIds: (network?.activePartners ?? []).map((p) => p.id),
  };
}

export function grossisteBOrderGovernance(
  order: GrossisteOrderRow,
): CommerceOrderConversationGovernance {
  if (order.status === "delivery") {
    return { orderId: order.id, scope: "delivery-only", conversationMode: "ORDER_CONTEXT_ONLY" };
  }
  if (order.status === "validation") {
    return { orderId: order.id, scope: "open", conversationMode: "NEGOTIABLE" };
  }
  return { orderId: order.id, scope: "readonly", conversationMode: "ORDER_CONTEXT_ONLY" };
}

function partnerTypeFor(
  network: GrossisteNetworkDto | null,
  partnerName: string,
): string | undefined {
  return network?.recentPartners.find((p) => p.name === partnerName)?.type;
}

function isClosedPartner(
  account: CommerceMessagingAccountSettings,
  partnerId?: string,
): boolean {
  if (!partnerId) return false;
  return !account.authorizedPartnerIds.includes(partnerId);
}

function buildMetaList(source: GrossisteBMessagingSource): ConvMeta[] {
  const { network, orders, activity, catalog } = source;
  const metas: ConvMeta[] = [];
  const orderRows = [...(orders?.received ?? []), ...(orders?.sent ?? [])];

  for (const p of network?.activePartners ?? []) {
    const linked = orderRows.find((o) => o.partner === p.name);
    const product = activity?.movingProducts[0];
    const pType = partnerTypeFor(network, p.name);
    metas.push({
      conversation: {
        id: `gb-msg-${p.id}`,
        category: linked ? "commandes" : "reseau",
        partnerName: terrainPartnerDisplayName(p.id, p.name, p.city),
        partnerId: p.id,
        partnerRole: pType ?? "partenaire",
        recentActivity: linked
          ? `${orderActivityStatus(linked.status)} — ${linked.amountLabel}`
          : `${p.orders7d} commandes / 7j`,
        productName: product?.name,
        activityStatus: linked ? orderActivityStatus(linked.status) : "Partenaire actif",
        needsReply: linked?.status === "validation",
        city: p.city,
        corridor: network?.corridorActivity.find((c) => c.level === "active")?.label,
        linkedOrderId: linked?.id,
        linkedOrderLabel: linked?.amountLabel,
      },
      productName: product?.name,
      orderId: linked?.id,
      productId: product?.id ?? catalog?.popularIds[0],
      partnerType: pType,
    });
  }

  for (const rp of network?.recentPartners ?? []) {
    if (metas.some((m) => m.conversation.partnerId === rp.id)) continue;
    if ((network?.activePartners ?? []).some((a) => a.id === rp.id)) continue;
    metas.push({
      conversation: {
        id: `gb-msg-closed-${rp.id}`,
        category: "reseau",
        partnerName: terrainPartnerDisplayName(rp.id, rp.name, rp.city),
        partnerId: rp.id,
        partnerRole: rp.type,
        recentActivity: `Dernier contact — ${rp.lastActive}`,
        activityStatus: "Hors réseau actif",
        needsReply: false,
        city: rp.city,
      },
      partnerType: rp.type,
    });
  }

  for (const o of orderRows) {
    if (metas.some((m) => m.conversation.partnerName === o.partner)) continue;
    const product = activity?.movingProducts[0];
    metas.push({
      conversation: {
        id: `gb-msg-order-${o.id}`,
        category: "commandes",
        partnerName: terrainPartnerDisplayName(`order-${o.id}`, o.partner, o.city),
        partnerId: `order-${o.id}`,
        partnerRole: partnerTypeFor(network, o.partner) ?? "partenaire",
        recentActivity: `${orderActivityStatus(o.status)} · ${o.updatedAt}`,
        productName: product?.name,
        activityStatus: orderActivityStatus(o.status),
        needsReply: o.status === "validation" || o.late,
        city: o.city,
        linkedOrderId: o.id,
        linkedOrderLabel: o.amountLabel,
      },
      productName: product?.name,
      orderId: o.id,
      productId: product?.id,
      partnerType: partnerTypeFor(network, o.partner),
    });
  }

  const limitedProduct = catalog?.products.find((p) => p.availability === "limited");
  if (limitedProduct && !metas.some((m) => m.productId === limitedProduct.id)) {
    metas.push({
      conversation: {
        id: `gb-msg-product-${limitedProduct.id}`,
        category: "produits",
        partnerName: network?.activePartners[0]?.name ?? "Réseau",
        partnerId: network?.activePartners[0]?.id ?? "reseau",
        partnerRole: "produit",
        recentActivity: `Stock limité — ${limitedProduct.name}`,
        productName: limitedProduct.name,
        activityStatus: "Prix fixe",
        needsReply: false,
        city: limitedProduct.city,
      },
      productName: limitedProduct.name,
      productId: limitedProduct.id,
    });
  }

  if (activity?.movingProducts.length) {
    const p = activity.movingProducts[0]!;
    if (!metas.some((m) => m.productName === p.name)) {
      metas.push({
        conversation: {
          id: `gb-msg-product-${p.id}`,
          category: "produits",
          partnerName: network?.activePartners[0]?.name ?? "Réseau",
          partnerId: network?.activePartners[0]?.id ?? "reseau",
          partnerRole: "produit",
          recentActivity: `Demande sur ${p.name}`,
          productName: p.name,
          activityStatus: "Forte demande",
          needsReply: false,
          city: activity.activeCities[0] ?? "Abidjan",
        },
        productName: p.name,
        productId: p.id,
      });
    }
  }

  if (network?.simpleSuggestions.length) {
    metas.push({
      conversation: {
        id: "gb-msg-terrain",
        category: "activite-terrain",
        partnerName: "Terrain réseau",
        partnerRole: "activité",
        recentActivity: network.simpleSuggestions[0] ?? "Activité terrain",
        activityStatus: "Réseau en mouvement",
        needsReply: false,
        city: activity?.activeCities[0] ?? "Abidjan",
        corridor: network.corridorActivity[0]?.label,
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
      attachmentLabel: `${meta.productName} — disponibilité à confirmer`,
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
    text: `${c.city} — activité réseau discrète.`,
    at: "08:22",
  });
  return msgs;
}

function productContext(
  meta: ConvMeta,
  catalogProducts: GrossisteCatalogProduct[],
): CommerceProductContext | null {
  if (!meta.productName) return null;
  const catalog = catalogProducts.find((p) => p.id === meta.productId);
  const settings = catalog ? grossisteBProductConversationSettings(catalog) : null;
  return {
    productId: meta.productId ?? "pr",
    name: meta.productName,
    availability: catalog?.availability === "limited" ? "Stock limité" : "Disponible terrain",
    recentActivity: settings?.conversationEnabled
      ? "Échanges actifs aujourd'hui"
      : "Suivi commande uniquement",
    demand: catalog?.badge === "forte-demande" ? "Forte demande" : "Demande normale",
    networkStatus: "Réseau actif",
    city: meta.conversation.city,
    conversationEnabled: settings?.conversationEnabled,
    conversationMode: settings?.conversationMode,
  };
}

function orderContext(meta: ConvMeta, orders: GrossisteOrdersDto | null): CommerceOrderContext | null {
  if (!meta.orderId || !orders) return null;
  const row = [...orders.received, ...orders.sent].find((o) => o.id === meta.orderId);
  if (!row) return null;
  return {
    orderId: row.id,
    partner: row.partner,
    status: orderActivityStatus(row.status),
    preparation: row.status === "preparation" ? "En cours" : "—",
    delivery: row.status === "delivery" ? "En cours" : "Planifiée",
    lateNote: row.late ? "Légèrement en retard" : undefined,
    amountLabel: row.amountLabel,
    conversationScope: grossisteBOrderGovernance(row).scope,
  };
}

function buildGrossisteBGovernanceBundle(source: GrossisteBMessagingSource) {
  const account = buildGrossisteBAccountSettings(source.network);
  const catalogProducts = source.catalog?.products ?? [];
  const productMap = grossisteBProductSettingsById(catalogProducts);

  const resolveForConversation = (input: {
    conversationId: string;
    partnerId?: string;
    productId?: string;
    order?: GrossisteOrderRow | null;
    partnerType?: string;
  }): ResolvedConversationGovernance => {
    if (!source.governanceEnabled) {
      return resolveConversationGovernance({ account });
    }

    const product: CommerceProductConversationSettings | null = input.productId
      ? (productMap.get(input.productId) ??
        grossisteBProductConversationSettings(
          catalogProducts.find((p) => p.id === input.productId) ?? {
            id: input.productId,
            name: "",
            category: "riz",
            availability: "available",
            priceLabel: "",
            city: "Abidjan",
          },
        ))
      : null;

    const order = input.order ? grossisteBOrderGovernance(input.order) : null;

    let partnerAuthorized = input.partnerId
      ? account.authorizedPartnerIds.includes(input.partnerId)
      : true;

    if (isClosedPartner(account, input.partnerId)) {
      partnerAuthorized = false;
    }

    const isDetailer = (input.partnerType ?? "").toLowerCase().includes("détaillant");
    const accountForResolve: CommerceMessagingAccountSettings = isDetailer
      ? { ...account, defaultMode: "NEGOTIABLE" }
      : account;

    const resolved = resolveConversationGovernance({
      account: accountForResolve,
      product,
      order,
      partnerId: input.partnerId,
      partnerAuthorized,
    });

    if (isClosedPartner(account, input.partnerId)) {
      return { ...resolved, mode: "PARTNER_ONLY", composerVisible: false, partnerAuthorized: false };
    }

    return resolved;
  };

  return { account, productMap, resolveForConversation };
}

export function buildGrossisteBMessagingInjected(
  source: GrossisteBMessagingSource,
): CommerceMessagingInjectedData {
  const catalogProducts = source.catalog?.products ?? [];
  const governanceBundle = source.governanceEnabled
    ? buildGrossisteBGovernanceBundle(source)
    : null;

  const metas = buildMetaList(source);
  if (governanceBundle) {
    for (const m of metas) {
      const orderRow =
        m.orderId && source.orders
          ? [...source.orders.received, ...source.orders.sent].find((o) => o.id === m.orderId)
          : null;
      const resolved = governanceBundle.resolveForConversation({
        conversationId: m.conversation.id,
        partnerId: m.conversation.partnerId,
        productId: m.productId,
        order: orderRow ?? null,
        partnerType: m.partnerType,
      });
      m.conversation.conversationMode = resolved.mode;
    }
  }
  const byId = new Map(metas.map((m) => [m.conversation.id, m]));

  const extraHints = [
    ...buildGrossisteBConversationHints(source.activity),
    ...buildGrossisteBPartnerSignals(source.network),
    ...buildGrossisteBOrderHints(source.orders),
    ...buildGrossisteBDemandSignals(source.catalog, source.activity),
  ];

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
      const row = [...source.orders.received, ...source.orders.sent].find((o) => o.id === meta.orderId);
      return row ? grossisteBOrderGovernance(row) : null;
    },
    resolveConversationGovernance: governanceBundle
      ? (id: string) => {
          const meta = byId.get(id);
          const orderRow = meta?.orderId
            ? [...(source.orders?.received ?? []), ...(source.orders?.sent ?? [])].find(
                (o) => o.id === meta.orderId,
              )
            : null;
          return governanceBundle.resolveForConversation({
            conversationId: id,
            partnerId: meta?.conversation.partnerId,
            productId: meta?.productId,
            order: orderRow ?? null,
            partnerType: meta?.partnerType,
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
    quickSuggestions: GROSSISTE_B_QUICK_SUGGESTIONS,
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
