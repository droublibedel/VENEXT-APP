import { resolveConversationGovernance } from "../governance/commerce-conversation-governance";
import type {
  CommerceMessagingAccountSettings,
  CommerceOrderConversationGovernance,
  CommerceProductConversationSettings,
} from "../governance/commerce-conversation-governance.types";
import type {
  CommerceConversation,
  CommerceMessage,
  CommerceNetworkStrip,
  CommerceOrderContext,
  CommerceProductContext,
} from "../hooks/commerce-messaging.types";

export const COMMERCE_MESSAGING_ORG_ID = "org-commerce-messaging-demo";

export const COMMERCE_CITIES = [
  "Abidjan",
  "Bouaké",
  "Korhogo",
  "San Pedro",
  "Yamoussoukro",
  "Man",
] as const;

export function mockCommerceAccountSettings(): CommerceMessagingAccountSettings {
  return {
    messagingEnabled: true,
    defaultMode: "NEGOTIABLE",
    partnersOnly: false,
    authorizedPartnerIds: ["pt-grossiste", "pt-detail"],
  };
}

export function mockProductConversationSettings(
  productId: string,
): CommerceProductConversationSettings {
  const map: Record<string, CommerceProductConversationSettings> = {
    "pr-industrial": {
      productId: "pr-industrial",
      conversationEnabled: false,
      conversationMode: "DISABLED",
    },
    "pr-fixed": {
      productId: "pr-fixed",
      conversationEnabled: true,
      conversationMode: "FIXED_PRICE_ONLY",
    },
    pr1: {
      productId: "pr1",
      conversationEnabled: true,
      conversationMode: "NEGOTIABLE",
    },
    "pr-partner": {
      productId: "pr-partner",
      conversationEnabled: true,
      conversationMode: "PARTNER_ONLY",
    },
  };
  return (
    map[productId] ?? {
      productId,
      conversationEnabled: true,
      conversationMode: "NEGOTIABLE",
    }
  );
}

export function mockOrderConversationGovernance(
  orderId: string,
): CommerceOrderConversationGovernance {
  if (orderId === "o-readonly") {
    return { orderId, scope: "readonly", conversationMode: "ORDER_CONTEXT_ONLY" };
  }
  if (orderId === "o3" || orderId === "o-delivery") {
    return { orderId, scope: "delivery-only", conversationMode: "ORDER_CONTEXT_ONLY" };
  }
  return { orderId, scope: "open" };
}

export function mockResolveConversationGovernance(conversationId: string) {
  const conv = mockCommerceConversations().find((c) => c.id === conversationId);
  const account = mockCommerceAccountSettings();
  const productId = conv?.productId ?? "pr1";
  const orderId = conv?.linkedOrderId;
  return resolveConversationGovernance({
    account,
    product: mockProductConversationSettings(productId),
    order: orderId ? mockOrderConversationGovernance(orderId) : null,
    partnerId: conv?.partnerId,
    partnerAuthorized: conv?.partnerId
      ? account.authorizedPartnerIds.includes(conv.partnerId)
      : true,
  });
}

export function mockCommerceConversations(): CommerceConversation[] {
  return [
    {
      id: "c1",
      category: "commandes",
      partnerName: "Boutique Plateau",
      partnerRole: "détaillant",
      partnerId: "pt-detail",
      recentActivity: "Commande en préparation",
      productName: "Riz 25kg",
      productId: "pr1",
      activityStatus: "En cours",
      needsReply: true,
      city: "Abidjan",
      corridor: "Hub Abidjan",
      linkedOrderId: "o1",
      linkedOrderLabel: "84 200 FCFA",
      conversationMode: "NEGOTIABLE",
    },
    {
      id: "c2",
      category: "produits",
      partnerName: "Grossiste Importateur CI",
      partnerRole: "grossiste importateur",
      partnerId: "pt-grossiste",
      recentActivity: "Demande huile 1L",
      productName: "Huile 1L",
      productId: "pr1",
      activityStatus: "Stock limité",
      needsReply: false,
      city: "Bouaké",
      corridor: "Axe nord",
      conversationMode: "NEGOTIABLE",
    },
    {
      id: "c3",
      category: "reseau",
      partnerName: "Producteur Industriel Ouest",
      partnerRole: "producteur industriel",
      partnerId: "pt-producer",
      recentActivity: "Prix catalogue — pas de discussion",
      productName: "Farine industrielle",
      productId: "pr-industrial",
      activityStatus: "Prix fixe",
      needsReply: false,
      city: "San Pedro",
      conversationMode: "DISABLED",
    },
    {
      id: "c4",
      category: "activite-terrain",
      partnerName: "Détaillant Réseau Korhogo",
      partnerRole: "détaillant réseau",
      partnerId: "pt-detail",
      recentActivity: "Corridor actif ce matin",
      productName: "Eau pack",
      productId: "pr-partner",
      activityStatus: "Dynamique",
      needsReply: false,
      city: "Korhogo",
      corridor: "Nord Korhogo",
      linkedOrderId: "o2",
      linkedOrderLabel: "32 000 FCFA",
      conversationMode: "PARTNER_ONLY",
    },
    {
      id: "c5",
      category: "commandes",
      partnerName: "Épicerie Yamoussoukro",
      partnerRole: "détaillant",
      partnerId: "pt-detail-2",
      recentActivity: "Livraison en cours",
      activityStatus: "Livraison",
      needsReply: false,
      city: "Yamoussoukro",
      linkedOrderId: "o3",
      linkedOrderLabel: "18 500 FCFA",
      conversationMode: "ORDER_CONTEXT_ONLY",
    },
    {
      id: "c6",
      category: "produits",
      partnerName: "Dépôt Man",
      partnerRole: "grossiste",
      partnerId: "pt-grossiste-2",
      recentActivity: "Disponibilité farine — prix fixe",
      productName: "Farine 50kg",
      productId: "pr-fixed",
      activityStatus: "Disponible",
      needsReply: false,
      city: "Man",
      conversationMode: "FIXED_PRICE_ONLY",
    },
    {
      id: "c7",
      category: "produits",
      partnerName: "Producteur Agro Ouest",
      partnerRole: "producteur",
      partnerId: "pt-producer-2",
      recentActivity: "Commandes sans discussion",
      productName: "Conserves pack",
      productId: "pr-industrial",
      activityStatus: "Catalogue",
      needsReply: false,
      city: "San Pedro",
      conversationMode: "DISABLED",
    },
  ];
}

export function mockCommerceMessages(conversationId: string): CommerceMessage[] {
  const base: CommerceMessage[] = [
    {
      id: "m1",
      conversationId,
      kind: "text",
      author: "partner",
      text: "Bonjour — besoin d'une confirmation sur la commande.",
      at: "08:12",
    },
    {
      id: "m2",
      conversationId,
      kind: "product",
      author: "partner",
      text: "Produit concerné",
      at: "08:13",
      productId: "pr1",
      attachmentLabel: "Riz 25kg — forte demande",
    },
    {
      id: "m3",
      conversationId,
      kind: "order",
      author: "self",
      text: "Commande mise à jour",
      at: "08:20",
      orderId: "o1",
      attachmentLabel: "Préparation en cours",
    },
    {
      id: "m4",
      conversationId,
      kind: "activity",
      author: "partner",
      text: "Activité corridor nord soutenue ce matin.",
      at: "08:25",
    },
    {
      id: "m5",
      conversationId,
      kind: "text",
      author: "self",
      text: "Merci — je prépare la livraison pour cet après-midi.",
      at: "08:30",
    },
  ];
  return base;
}

export function mockProductContext(productId = "pr1"): CommerceProductContext {
  const settings = mockProductConversationSettings(productId);
  const names: Record<string, string> = {
    "pr-industrial": "Farine industrielle",
    "pr-fixed": "Farine 50kg",
    pr1: "Riz 25kg",
    "pr-partner": "Eau pack",
  };
  return {
    productId,
    name: names[productId] ?? "Riz 25kg",
    availability: "Disponible — stock limité Abidjan",
    recentActivity: settings.conversationEnabled ? "12 discussions aujourd'hui" : "Commandes sans discussion",
    demand: "Forte demande",
    networkStatus: "Réseau actif",
    city: "Abidjan",
    conversationEnabled: settings.conversationEnabled,
    conversationMode: settings.conversationMode,
  };
}

export function mockOrderContext(orderId = "o1"): CommerceOrderContext {
  const gov = mockOrderConversationGovernance(orderId);
  return {
    orderId,
    partner: "Boutique Plateau",
    status: orderId === "o3" ? "En livraison" : "En préparation",
    preparation: "En cours — 6 articles",
    delivery: orderId === "o3" ? "En cours" : "Prévue cet après-midi",
    lateNote: undefined,
    amountLabel: "84 200 FCFA",
    conversationScope: gov.scope,
  };
}

export function mockNetworkStrip(conversationId: string): CommerceNetworkStrip {
  const conv = mockCommerceConversations().find((c) => c.id === conversationId);
  return {
    corridor: conv?.corridor ?? "Hub Abidjan",
    activeCity: conv?.city ?? "Abidjan",
    demandedProduct: conv?.productName,
    activePartner: conv?.partnerName,
  };
}
