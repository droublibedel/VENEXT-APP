type Dict = Record<string, string>;

const FR: Dict = {
  "activity.title": "Activité commerciale",
  "activity.empty": "Aucune activité récente dans votre réseau.",
  "activity.summary.quiet": "Journée calme sur votre réseau.",
  "activity.summary.orders_busy": "Plusieurs commandes aujourd'hui.",
  "activity.summary.deliveries_active": "Livraisons en cours sur votre réseau.",
  "activity.timeline.today": "Aujourd'hui",
  "activity.timeline.yesterday": "Hier",
  "activity.timeline.this_week": "Cette semaine",
  "activity.timeline.older": "Plus ancien",
  "activity.groups.orders": "{count} commande(s) reçue(s)",
  "activity.groups.deliveries": "{count} livraison(s)",
  "activity.groups.settlements": "{count} règlement(s)",
  "activity.groups.catalogs": "Catalogue relationnel",
  "activity.groups.partners": "Activité partenaire",
  "activity.groups.messages": "Messages terrain",
  "activity.groups.mails": "Mails professionnels",
  "activity.groups.wallet": "Wallet",
  "activity.groups.network": "Réseau commercial",
  "activity.groups.generic": "Activité",
  "activity.filters.all": "Tout",
  "activity.filters.orders": "Commandes",
  "activity.filters.deliveries": "Livraisons",
  "activity.filters.settlements": "Règlements",
  "activity.filters.catalogs": "Catalogues",
  "activity.filters.partners": "Partenaires",
  "activity.filters.messages": "Messages",
  "activity.filters.mails": "Mails",
  "activity.filters.wallet": "Wallet",
  "activity.events.ORDER_CREATED": "Nouvelle commande",
  "activity.events.ORDER_CONFIRMED": "Commande confirmée",
  "activity.events.ORDER_COMPLETED": "Commande terminée",
  "activity.events.DELIVERY_STARTED": "Livraison démarrée",
  "activity.events.DELIVERY_CONFIRMED": "Livraison confirmée",
  "activity.events.SETTLEMENT_RECEIVED": "Règlement reçu",
  "activity.events.RELATION_ESTABLISHED": "Nouvelle relation",
  "activity.events.NEW_RELATIONAL_CATALOG": "Catalogue disponible",
  "activity.events.SPONSORED_PRODUCT_VISIBLE": "Suggestion produit",
  "activity.events.PARTNER_ACTIVITY": "Activité partenaire",
  "activity.events.NETWORK_ACTIVITY": "Activité réseau",
  "activity.events.MAIL_SENT": "Mail envoyé",
  "activity.events.MESSAGE_ACTIVITY": "Message commerce",
  "activity.events.WALLET_ACTIVATED": "Règlements activés",
  "activity.events.WALLET_SECURED": "Wallet sécurisé",
  "activity.actions.open": "Voir",
};

const EN: Dict = { ...FR, "activity.title": "Commercial activity", "activity.empty": "No recent activity." };
const AR: Dict = { ...FR, "activity.title": "النشاط التجاري", "activity.timeline.today": "اليوم" };
const ZH: Dict = { ...FR, "activity.title": "商业动态", "activity.timeline.today": "今天" };

const BY_LOCALE: Record<string, Dict> = {
  "fr-CI": FR,
  fr: FR,
  en: EN,
  ar: AR,
  "zh-CN": ZH,
  zh: ZH,
};

export function getActivityTranslation(key: string, locale = "fr-CI"): string {
  const dict = BY_LOCALE[locale] ?? BY_LOCALE["fr-CI"] ?? FR;
  return dict[key] ?? FR[key] ?? key;
}
