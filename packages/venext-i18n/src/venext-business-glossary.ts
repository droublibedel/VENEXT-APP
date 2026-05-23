import type { VenextActorRole, VenextLocale, VenextRelationshipType } from "./venext-i18n.types";

/** Commerce-first glossary hints — not for mechanical translation, for QA and copy consistency. */
export const VENEXT_BUSINESS_GLOSSARY: Record<
  VenextLocale,
  {
    settlement: Record<VenextActorRole, string>;
    communication: Record<VenextRelationshipType, string>;
  }
> = {
  "fr-CI": {
    settlement: {
      producteur: "Règlement partenaire",
      grossiste_a: "Règlement réseau",
      grossiste_b: "Règlement terrain",
      detaillant: "Paiement",
    },
    communication: {
      formal: "Mail professionnel",
      terrain: "Messagerie terrain",
      hybrid: "Échange adapté au partenaire",
      contactFirst: "Contact puis échange",
      partnerOnly: "Partenaire validé uniquement",
    },
  },
  en: {
    settlement: {
      producteur: "Partner settlement",
      grossiste_a: "Network settlement",
      grossiste_b: "Field settlement",
      detaillant: "Payment",
    },
    communication: {
      formal: "Professional mail",
      terrain: "Field messaging",
      hybrid: "Partner-adapted exchange",
      contactFirst: "Contact-first exchange",
      partnerOnly: "Validated partners only",
    },
  },
  ar: {
    settlement: {
      producteur: "تسوية الشريك",
      grossiste_a: "تسوية الشبكة",
      grossiste_b: "تسوية ميدانية",
      detaillant: "دفع",
    },
    communication: {
      formal: "بريد مهني",
      terrain: "مراسلة ميدانية",
      hybrid: "تواصل حسب الشريك",
      contactFirst: "تواصل عبر جهة الاتصال",
      partnerOnly: "شركاء معتمدون فقط",
    },
  },
  "zh-CN": {
    settlement: {
      producteur: "伙伴结算",
      grossiste_a: "网络结算",
      grossiste_b: "现场结算",
      detaillant: "付款",
    },
    communication: {
      formal: "商务邮件",
      terrain: "现场消息",
      hybrid: "按伙伴适配沟通",
      contactFirst: "先联系后沟通",
      partnerOnly: "仅已验证伙伴",
    },
  },
};
