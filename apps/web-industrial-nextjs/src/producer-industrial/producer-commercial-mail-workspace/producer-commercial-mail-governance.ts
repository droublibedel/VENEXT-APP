export type ProducerMailMode =
  | "MAIL_DISABLED"
  | "MAIL_ENABLED"
  | "PARTNER_ONLY"
  | "ORDER_CONTEXT_ONLY"
  | "PRODUCT_CONTEXT_ALLOWED"
  | "DIRECT_MAIL_ALLOWED";

export type ProducerMailGovernance = {
  mode: ProducerMailMode;
  composeVisible: boolean;
  partnerOnly: boolean;
  orderContextRequired: boolean;
  productContextAllowed: boolean;
  directMailAllowed: boolean;
  notice?: string;
};

export const PRODUCER_MAIL_MODE_LABELS: Record<ProducerMailMode, string> = {
  MAIL_DISABLED: "Mails désactivés",
  MAIL_ENABLED: "Boîte mail active",
  PARTNER_ONLY: "Partenaires réseau uniquement",
  ORDER_CONTEXT_ONLY: "Contexte commande",
  PRODUCT_CONTEXT_ALLOWED: "Produit autorisé",
  DIRECT_MAIL_ALLOWED: "Mail libre autorisé",
};

export function defaultProducerMailGovernance(): ProducerMailGovernance {
  return {
    mode: "MAIL_ENABLED",
    composeVisible: true,
    partnerOnly: false,
    orderContextRequired: false,
    productContextAllowed: true,
    directMailAllowed: true,
  };
}

export function resolveProducerMailGovernance(flags: {
  producer_commercial_mail_enabled?: boolean;
}): ProducerMailGovernance {
  if (flags.producer_commercial_mail_enabled === false) {
    return {
      mode: "MAIL_DISABLED",
      composeVisible: false,
      partnerOnly: true,
      orderContextRequired: false,
      productContextAllowed: false,
      directMailAllowed: false,
      notice: "Boîte mail réseau — non activée pour cet environnement.",
    };
  }
  return defaultProducerMailGovernance();
}
