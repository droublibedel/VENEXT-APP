/** Dictionnaires légers — branchables via venext-i18n en app (Instruction 20.80). */

type Dict = Record<string, string>;

const FR: Dict = {
  "notifications.title": "Activité commerciale",
  "notifications.empty": "Aucune alerte importante pour le moment.",
  "notifications.markAllRead": "Tout marquer comme lu",
  "notifications.preferences": "Préférences",
  "notifications.devBadge": "Mode démo",
  "notifications.actions.open": "Ouvrir",
  "notifications.actions.viewOrder": "Voir la commande",
  "notifications.actions.viewDelivery": "Voir la livraison",
  "notifications.actions.viewSettlement": "Voir le règlement",
  "notifications.actions.openConversation": "Ouvrir la conversation",
  "notifications.actions.openMail": "Ouvrir le mail",
  "notifications.actions.viewCatalog": "Voir le catalogue",
  "notifications.actions.openWallet": "Ouvrir les règlements",
  "notifications.events.ORDER_CREATED": "Nouvelle commande",
  "notifications.events.ORDER_VALIDATED": "Commande validée",
  "notifications.events.ORDER_UPDATED": "Commande à traiter",
  "notifications.events.DELIVERY_STARTED": "Livraison démarrée",
  "notifications.events.DELIVERY_NEAR": "Livraison proche",
  "notifications.events.DELIVERY_CONFIRMED": "Livraison confirmée",
  "notifications.events.SETTLEMENT_RECEIVED": "Règlement reçu",
  "notifications.events.SETTLEMENT_PENDING": "Règlement à confirmer",
  "notifications.events.WALLET_SECURED": "Wallet sécurisé",
  "notifications.events.WALLET_LOCKED": "Wallet verrouillé",
  "notifications.events.MESSAGE_RECEIVED": "Nouveau message",
  "notifications.events.MAIL_RECEIVED": "Nouveau mail partenaire",
  "notifications.events.RELATION_REQUEST": "Demande de relation",
  "notifications.events.RELATION_ACCEPTED": "Relation acceptée",
  "notifications.events.CATALOG_AVAILABLE": "Catalogue disponible",
  "notifications.events.SPONSORED_CATALOG_AVAILABLE": "Suggestion catalogue",
  "notifications.events.CONTEXT_RETURN_AVAILABLE": "Reprendre votre activité",
  "notifications.hints.ORDER_VALIDATED": "Votre partenaire a validé la commande.",
  "notifications.hints.DELIVERY_NEAR": "Préparez la réception.",
  "notifications.hints.SETTLEMENT_PENDING": "Confirmez le paiement démo.",
  "notifications.prefs.orders": "Commandes",
  "notifications.prefs.deliveries": "Livraisons",
  "notifications.prefs.settlements": "Règlements",
  "notifications.prefs.messages": "Messages",
  "notifications.prefs.mails": "Mails professionnels",
  "notifications.prefs.relations": "Relations",
  "notifications.prefs.catalogs": "Catalogues",
  "notifications.prefs.wallet": "Sécurité wallet",
  "notifications.prefs.sponsored": "Suggestions discrètes",
};

const EN: Dict = {
  ...FR,
  "notifications.title": "Commercial activity",
  "notifications.empty": "No important alerts right now.",
  "notifications.markAllRead": "Mark all as read",
};

const AR: Dict = {
  ...FR,
  "notifications.title": "النشاط التجاري",
  "notifications.empty": "لا تنبيهات مهمة حالياً.",
};

const ZH: Dict = {
  ...FR,
  "notifications.title": "商业动态",
  "notifications.empty": "暂无重要提醒。",
};

const BY_LOCALE: Record<string, Dict> = {
  "fr-CI": FR,
  fr: FR,
  en: EN,
  ar: AR,
  "zh-CN": ZH,
  zh: ZH,
};

export function getNotificationTranslation(key: string, locale = "fr-CI"): string {
  const dict = BY_LOCALE[locale] ?? BY_LOCALE["fr-CI"] ?? FR;
  return dict[key] ?? FR[key] ?? key;
}
