const SECURITY_COPY: Record<string, Record<string, string>> = {
  "security.user.suspended.public": {
    "fr-CI":
      "Votre accès est temporairement suspendu. Veuillez contacter le service compétent pour plus d'informations.",
    en: "Your access is temporarily suspended. Please contact the appropriate service for more information.",
    ar: "تم تعليق وصولك مؤقتًا. يرجى الاتصال بالجهة المختصة لمزيد من المعلومات.",
    zh: "您的访问已被暂时暂停。请联系相关部门了解更多信息。",
  },
  "security.internal.workspace": {
    "fr-CI": "Sécurité interne entreprise",
    en: "Enterprise internal security",
    ar: "الأمن الداخلي للمؤسسة",
    zh: "企业内部安全",
  },
  "security.archive.workflow": {
    "fr-CI": "Archivage supervisé",
    en: "Supervised archiving",
    ar: "أرشفة خاضعة للإشراف",
    zh: "受监管归档",
  },
  "security.note.required": {
    "fr-CI": "Une note de justification est obligatoire (8 caractères minimum).",
    en: "A justification note is required (minimum 8 characters).",
    ar: "مطلوب مذكرة تبرير (8 أحرف على الأقل).",
    zh: "必须填写说明备注（至少 8 个字符）。",
  },
  "security.alerts.title": {
    "fr-CI": "Alertes sécurité",
    en: "Security alerts",
    ar: "تنبيهات الأمان",
    zh: "安全警报",
  },
  "security.history.title": {
    "fr-CI": "Historique gouvernance",
    en: "Governance history",
    ar: "سجل الحوكمة",
    zh: "治理历史",
  },
  "security.document.attachment": {
    "fr-CI": "Document justificatif",
    en: "Supporting document",
    ar: "وثيقة داعمة",
    zh: "证明文件",
  },
  "security.connection.verify": {
    "fr-CI": "Une nouvelle connexion nécessite une vérification.",
    en: "A new sign-in needs a quick verification.",
    ar: "يتطلب اتصال جديد تحققًا سريعًا.",
    zh: "新的登录需要简单验证。",
  },
  "enterprise.access.suspended": {
    "fr-CI": "Votre accès est en pause. Reconnectez-vous ou contactez votre référent.",
    en: "Your access is paused. Sign in again or contact your administrator.",
    ar: "تم إيقاف وصولك مؤقتًا. أعد تسجيل الدخول أو تواصل مع المسؤول.",
    zh: "您的访问已暂停。请重新登录或联系管理员。",
  },
  "enterprise.access.archived": {
    "fr-CI": "Ce compte n'est plus actif sur VENEXT.",
    en: "This account is no longer active on VENEXT.",
    ar: "هذا الحساب لم يعد نشطًا على VENEXT.",
    zh: "此账户在 VENEXT 上已不再活跃。",
  },
};

export function getEnterpriseSecurityTranslation(key: string, locale = "fr-CI"): string {
  const row = SECURITY_COPY[key];
  if (!row) return key;
  if (row[locale]) return row[locale]!;
  if (locale.startsWith("fr") && row["fr-CI"]) return row["fr-CI"];
  return row.en ?? key;
}
