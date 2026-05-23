type Dict = Record<string, string>;

const FR: Dict = {
  "offline.banner.weak": "Connexion faible",
  "offline.banner.offline": "Hors ligne — activité sauvegardée",
  "offline.sync.pending": "Synchronisation en attente",
  "offline.sync.done": "Activité à jour",
  "offline.sync.update": "Mise à jour disponible",
  "offline.queue.empty": "Aucune action en attente",
  "offline.queue.title": "Actions en attente",
  "offline.connectivity.online": "En ligne",
  "offline.connectivity.degraded": "Connexion faible",
  "offline.connectivity.offline": "Hors ligne",
  "offline.wallet.wait": "Règlements disponibles après synchronisation",
  "offline.conflict.ORDER_ALREADY_CONFIRMED": "Commande déjà confirmée ailleurs",
  "offline.conflict.DELIVERY_ALREADY_CLOSED": "Livraison déjà clôturée",
  "offline.conflict.RELATION_REMOVED": "Relation plus disponible",
  "offline.conflict.STALE_CACHE": "Données expirées — actualisez",
  "offline.conflict.UNKNOWN": "Action non appliquée",
};

const EN: Dict = {
  ...FR,
  "offline.banner.weak": "Weak connection",
  "offline.banner.offline": "Offline — activity saved",
  "offline.sync.pending": "Sync pending",
  "offline.sync.done": "Up to date",
  "offline.sync.update": "Update available",
};

const AR: Dict = { ...FR, "offline.banner.weak": "اتصال ضعيف", "offline.connectivity.offline": "غير متصل" };
const ZH: Dict = { ...FR, "offline.banner.weak": "网络较弱", "offline.connectivity.offline": "离线" };

const BY_LOCALE: Record<string, Dict> = {
  "fr-CI": FR,
  fr: FR,
  en: EN,
  ar: AR,
  "zh-CN": ZH,
  zh: ZH,
};

export function getOfflineTranslation(key: string, locale = "fr-CI"): string {
  const dict = BY_LOCALE[locale] ?? BY_LOCALE[locale.split("-")[0] ?? ""] ?? FR;
  return dict[key] ?? FR[key] ?? key;
}
