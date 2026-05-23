const COPY: Record<string, Record<string, string>> = {
  "enterprise.governance.title": {
    "fr-CI": "Gouvernance grands comptes",
    en: "Large account governance",
    ar: "حوكمة الحسابات الكبرى",
    zh: "大客户治理",
  },
  "enterprise.channel.workspace": {
    "fr-CI": "Canal entreprise supervisé",
    en: "Supervised enterprise channel",
    ar: "قناة مؤسسة خاضعة للإشراف",
    zh: "受监管企业通道",
  },
  "enterprise.onboarding.timeline": {
    "fr-CI": "Parcours d'activation industriel",
    en: "Industrial activation journey",
    ar: "مسار التفعيل الصناعي",
    zh: "工业激活流程",
  },
  "enterprise.validation.pending": {
    "fr-CI": "En attente de validation VENEXT",
    en: "Pending VENEXT validation",
    ar: "بانتظار التحقق من VENEXT",
    zh: "待 VENEXT 审核",
  },
  "enterprise.security.control": {
    "fr-CI": "Contrôle sécurité industriel",
    en: "Industrial security control",
    ar: "التحكم الأمني الصناعي",
    zh: "工业安全控制",
  },
  "enterprise.poles.existing_only": {
    "fr-CI": "Pôles VENEXT existants uniquement",
    en: "Existing VENEXT poles only",
    ar: "أقطاب VENEXT الحالية فقط",
    zh: "仅限现有 VENEXT 职能",
  },
};

export function getEnterpriseGovernanceTranslation(key: string, locale = "fr-CI"): string {
  const row = COPY[key];
  if (!row) return key;
  if (row[locale]) return row[locale]!;
  if (locale.startsWith("fr") && row["fr-CI"]) return row["fr-CI"];
  return row.en ?? key;
}
