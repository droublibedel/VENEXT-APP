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
  DetaillantDataSource,
  DetaillantHomeDto,
  DetaillantNetworkDto,
  DetaillantOrderRow,
  DetaillantOrdersDto,
  DetaillantProduct,
  DetaillantProductsDto,
} from "../hooks/detaillant-data.types";
import { resolveTerrainPartnerDisplayName } from "commercial-network-discovery";

import {
  buildRetailDemandSignals,
  buildRetailHints,
  buildRetailSignals,
  DETAILLANT_QUICK_SUGGESTIONS,
} from "./detaillant-messaging-intelligence";

const DETAILLANT_LOCAL_CONTACTS: Record<string, string> = {
  sup1: "François",
  sup2: "Grossiste Treichville",
};

function terrainSupplierDisplayName(supplierId: string, businessName: string, city?: string): string {
  return resolveTerrainPartnerDisplayName({
    partnerId: supplierId,
    phone: "+2250700000000",
    localContactName: DETAILLANT_LOCAL_CONTACTS[supplierId],
    registeredBusinessName: businessName,
    city,
    actorRole: "detaillant",
  }).displayName;
}
import {
  detaillantProductConversationSettings,
  detaillantProductSettingsById,
} from "./detaillant-product-governance";

export type DetaillantMessagingSource = {
  home: DetaillantHomeDto | null;
  products: DetaillantProductsDto | null;
  orders: DetaillantOrdersDto | null;
  network: DetaillantNetworkDto | null;
  governanceEnabled?: boolean;
  linkedContextEnabled?: boolean;
  linkedTimelineEnabled?: boolean;
  dataSource: DetaillantDataSource;
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
  "en-cours": "En cours",
  recue: "Reçue",
  livraison: "En livraison",
  terminee: "Terminée",
};

function orderStatusLabel(status: string): string {
  return STATUS_LABEL[status] ?? status;
}

function buildDetaillantAccountSettings(
  network: DetaillantNetworkDto | null,
): CommerceMessagingAccountSettings {
  const base = defaultCommerceAccountSettings();
  return {
    ...base,
    messagingEnabled: true,
    defaultMode: "FIXED_PRICE_ONLY",
    partnersOnly: true,
    authorizedPartnerIds: (network?.activeSuppliers ?? []).map((s) => s.id),
  };
}

export function detaillantOrderGovernance(
  order: DetaillantOrderRow,
): CommerceOrderConversationGovernance {
  if (order.status === "livraison") {
    return { orderId: order.id, scope: "delivery-only", conversationMode: "ORDER_CONTEXT_ONLY" };
  }
  if (order.status === "en-cours") {
    return { orderId: order.id, scope: "open", conversationMode: "NEGOTIABLE" };
  }
  return { orderId: order.id, scope: "readonly", conversationMode: "ORDER_CONTEXT_ONLY" };
}

function isPartnerAuthorized(
  account: CommerceMessagingAccountSettings,
  partnerId?: string,
): boolean {
  if (!partnerId) return true;
  return account.authorizedPartnerIds.includes(partnerId);
}

function buildMetaList(source: DetaillantMessagingSource): ConvMeta[] {
  const { network, orders, home, products } = source;
  const metas: ConvMeta[] = [];
  const orderRows = [...(orders?.enCours ?? []), ...(orders?.recues ?? [])];

  for (const s of network?.activeSuppliers ?? []) {
    const linked = orderRows.find((o) => o.partner === s.name);
    const product = home?.popularProducts[0];
    metas.push({
      conversation: {
        id: `dr-msg-${s.id}`,
        category: linked ? "commandes" : "reseau",
        partnerName: terrainSupplierDisplayName(s.id, s.name, s.city),
        partnerId: s.id,
        partnerRole: s.type,
        recentActivity: linked
          ? `${orderStatusLabel(linked.status)} — ${linked.amountLabel}`
          : "Fournisseur actif",
        productName: product?.name,
        activityStatus: linked ? orderStatusLabel(linked.status) : "Partenaire disponible",
        needsReply: linked?.status === "en-cours",
        city: s.city,
        linkedOrderId: linked?.id,
        linkedOrderLabel: linked?.amountLabel,
      },
      productName: product?.name,
      orderId: linked?.id,
      productId: product?.id ?? products?.popularIds[0],
    });
  }

  for (const np of network?.newPartners ?? []) {
    if (metas.some((m) => m.conversation.partnerName === np.name)) continue;
    metas.push({
      conversation: {
        id: `dr-msg-partner-${np.id}`,
        category: "reseau",
        partnerName: terrainSupplierDisplayName(np.id, np.name, np.city),
        partnerId: np.id,
        partnerRole: "partenaire",
        recentActivity: `Nouveau — ${np.since}`,
        activityStatus: "Réseau partenaire",
        needsReply: false,
        city: np.city,
      },
    });
  }

  for (const o of orderRows) {
    if (metas.some((m) => m.conversation.partnerName === o.partner)) continue;
    const product = home?.popularProducts[0];
    metas.push({
      conversation: {
        id: `dr-msg-order-${o.id}`,
        category: "commandes",
        partnerName: terrainSupplierDisplayName(`order-${o.id}`, o.partner, o.city),
        partnerId: `order-${o.id}`,
        partnerRole: "commande",
        recentActivity: `${orderStatusLabel(o.status)} · ${o.updatedAt}`,
        productName: product?.name,
        activityStatus: orderStatusLabel(o.status),
        needsReply: o.status === "livraison",
        city: o.city,
        linkedOrderId: o.id,
        linkedOrderLabel: o.amountLabel,
      },
      productName: product?.name,
      orderId: o.id,
      productId: product?.id,
    });
  }

  const limited = products?.products.find((p) => p.availability === "limited");
  if (limited && !metas.some((m) => m.productId === limited.id)) {
    metas.push({
      conversation: {
        id: `dr-msg-product-${limited.id}`,
        category: "produits",
        partnerName: network?.activeSuppliers[0]?.name ?? "Catalogue",
        partnerId: network?.activeSuppliers[0]?.id ?? "catalogue",
        partnerRole: "produit",
        recentActivity: `Stock limité — ${limited.name}`,
        productName: limited.name,
        activityStatus: "Prix fixe — commande directe",
        needsReply: false,
        city: limited.city,
      },
      productName: limited.name,
      productId: limited.id,
    });
  }

  const negotiable = products?.products.find((p) => p.badge === "tres-demande");
  if (negotiable && !metas.some((m) => m.productId === negotiable.id)) {
    metas.push({
      conversation: {
        id: `dr-msg-product-${negotiable.id}`,
        category: "produits",
        partnerName: network?.activeSuppliers[0]?.name ?? "Catalogue",
        partnerId: network?.activeSuppliers[0]?.id ?? "catalogue",
        partnerRole: "produit",
        recentActivity: `Discuter si besoin — ${negotiable.name}`,
        productName: negotiable.name,
        activityStatus: "Négociable",
        needsReply: false,
        city: negotiable.city,
      },
      productName: negotiable.name,
      productId: negotiable.id,
    });
  }

  if (network?.networkSuggestions.length) {
    metas.push({
      conversation: {
        id: "dr-msg-terrain",
        category: "activite-terrain",
        partnerName: "Votre zone",
        partnerRole: "activité",
        recentActivity: network.networkSuggestions[0] ?? "Activité locale",
        activityStatus: "Réseau en mouvement",
        needsReply: false,
        city: network.cityActivity[0]?.city ?? "Abidjan",
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
      text: `Bonjour — ${c.productName ? `suivi ${c.productName}` : "votre commande"}.`,
      at: "09:00",
    },
  ];
  if (meta.productName) {
    msgs.push({
      id: `${c.id}-m2`,
      conversationId: c.id,
      kind: "product",
      author: "partner",
      text: "Produit",
      at: "09:02",
      productId: meta.productId,
      attachmentLabel: meta.productName,
    });
  }
  if (meta.orderId) {
    msgs.push({
      id: `${c.id}-m3`,
      conversationId: c.id,
      kind: "order",
      author: "self",
      text: "Commande",
      at: "09:05",
      orderId: meta.orderId,
      attachmentLabel: c.linkedOrderLabel ?? "Commande",
      businessContext: "retailer_procurement",
    });
  }
  return msgs;
}

function productContext(
  meta: ConvMeta,
  catalogProducts: DetaillantProduct[],
): CommerceProductContext | null {
  if (!meta.productName) return null;
  const catalog = catalogProducts.find((p) => p.id === meta.productId);
  const settings = catalog ? detaillantProductConversationSettings(catalog) : null;
  return {
    productId: meta.productId ?? "pr",
    name: meta.productName,
    availability: catalog?.availability === "limited" ? "Stock limité" : "Disponible",
    recentActivity: "Commande rapide possible sans discussion",
    demand: catalog?.badge === "tres-demande" ? "Forte demande" : "Normale",
    networkStatus: "Zone active",
    city: meta.conversation.city,
    conversationEnabled: settings?.conversationEnabled,
    conversationMode: settings?.conversationMode,
  };
}

function orderContext(meta: ConvMeta, orders: DetaillantOrdersDto | null): CommerceOrderContext | null {
  if (!meta.orderId || !orders) return null;
  const row = [...orders.enCours, ...orders.recues, ...orders.terminees].find(
    (o) => o.id === meta.orderId,
  );
  if (!row) return null;
  return {
    orderId: row.id,
    partner: row.partner,
    status: orderStatusLabel(row.status),
    preparation: row.status === "en-cours" ? "En cours" : "—",
    delivery: row.status === "livraison" ? "En livraison" : "—",
    amountLabel: row.amountLabel,
    conversationScope: detaillantOrderGovernance(row).scope,
  };
}

function buildDetaillantGovernanceBundle(source: DetaillantMessagingSource) {
  const account = buildDetaillantAccountSettings(source.network);
  const catalogProducts = source.products?.products ?? [];
  const productMap = detaillantProductSettingsById(catalogProducts);

  const resolveForConversation = (input: {
    conversationId: string;
    partnerId?: string;
    productId?: string;
    order?: DetaillantOrderRow | null;
  }): ResolvedConversationGovernance => {
    if (!source.governanceEnabled) {
      return resolveConversationGovernance({ account });
    }

    const product: CommerceProductConversationSettings | null = input.productId
      ? (productMap.get(input.productId) ??
        detaillantProductConversationSettings(
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

    const order = input.order ? detaillantOrderGovernance(input.order) : null;
    const partnerAuthorized = isPartnerAuthorized(account, input.partnerId);

    const resolved = resolveConversationGovernance({
      account,
      product,
      order,
      partnerId: input.partnerId,
      partnerAuthorized,
    });

    if (!partnerAuthorized && input.partnerId?.startsWith("dr") === false) {
      const closedPartner = source.network?.newPartners.some((p) => p.id === input.partnerId);
      if (closedPartner || input.partnerId?.startsWith("n")) {
        return { ...resolved, mode: "PARTNER_ONLY", composerVisible: false, partnerAuthorized: false };
      }
    }

    return resolved;
  };

  return { account, productMap, resolveForConversation };
}

export function buildDetaillantMessagingInjected(
  source: DetaillantMessagingSource,
): CommerceMessagingInjectedData {
  const catalogProducts = source.products?.products ?? [];
  const governanceBundle = source.governanceEnabled
    ? buildDetaillantGovernanceBundle(source)
    : null;

  const metas = buildMetaList(source);
  if (governanceBundle) {
    for (const m of metas) {
      const orderRow =
        m.orderId && source.orders
          ? [...source.orders.enCours, ...source.orders.recues, ...source.orders.terminees].find(
              (o) => o.id === m.orderId,
            )
          : null;
      m.conversation.conversationMode = governanceBundle.resolveForConversation({
        conversationId: m.conversation.id,
        partnerId: m.conversation.partnerId,
        productId: m.productId,
        order: orderRow ?? null,
      }).mode;
    }
  }
  const byId = new Map(metas.map((m) => [m.conversation.id, m]));

  const extraHints = [
    ...buildRetailSignals(source.home),
    ...buildRetailHints(source.home, source.network),
    ...buildRetailDemandSignals(source.products, source.network),
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
      const row = [...source.orders.enCours, ...source.orders.recues, ...source.orders.terminees].find(
        (o) => o.id === meta.orderId,
      );
      return row ? detaillantOrderGovernance(row) : null;
    },
    resolveConversationGovernance: governanceBundle
      ? (id: string) => {
          const meta = byId.get(id);
          const orderRow = meta?.orderId
            ? [...(source.orders?.enCours ?? []), ...(source.orders?.recues ?? []), ...(source.orders?.terminees ?? [])].find(
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
        activeCity: meta.conversation.city,
        demandedProduct: meta.productName,
        activePartner: meta.conversation.partnerName,
      };
    },
    extraHints,
    quickSuggestions: DETAILLANT_QUICK_SUGGESTIONS,
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
