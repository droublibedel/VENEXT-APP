import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..", "src", "locales");

const domains = [
  "common",
  "navigation",
  "onboarding",
  "identity",
  "relationship",
  "catalog",
  "orders",
  "delivery",
  "wallet",
  "messaging",
  "mail",
  "notifications",
  "errors",
  "guardrails",
];

const L = {
  fr: {
    common: {
      app: { name: "VENEXT", loading: "Chargement…", refresh: "Actualiser", back: "Retour", save: "Enregistrer" },
      language: { label: "Langue", fr: "Français", en: "English", ar: "العربية", zh: "中文" },
      empty: { title: "Rien pour l'instant", hint: "Votre activité apparaîtra ici" },
    },
    navigation: {
      tabs: {
        activity: "Activité",
        messaging: "Messagerie",
        wallet: "Règlements",
        catalog: "Catalogue",
        orders: "Commandes",
        network: "Réseau",
        profile: "Profil",
        home: "Accueil",
        products: "Produits",
        account: "Compte",
      },
      actor: {
        producer: { pole: { network: "Réseau commercial", orders: "Commandes", mail: "Mail formel" } },
        grossisteA: { workspace: { orders: "Commandes", distribution: "Distribution", network: "Réseau" } },
        grossisteB: { tab: { activity: "Mon activité", orders: "Commandes" } },
        detaillant: { tab: { home: "Accueil", orders: "Mes commandes" } },
      },
    },
    onboarding: {
      phone: { title: "Votre numéro", hint: "Pour retrouver vos partenaires terrain", cta: "Continuer" },
      otp: { title: "Code reçu", hint: "Saisissez le code SMS", cta: "Valider" },
      identity: { title: "Comment vous présenter", pseudo: "Pseudo commercial", shop: "Boutique (optionnel)" },
      city: { title: "Votre ville", hint: "Pour les commandes autour de vous" },
      contacts: { title: "Contacts", allow: "Autoriser l'accès aux contacts", skip: "Plus tard" },
      autoAccept: { title: "Demandes partenaires", on: "Accepter automatiquement", off: "Valider chaque demande" },
    },
    identity: {
      profile: { title: "Profil", subtitle: "Identité commerciale" },
      phone: "Téléphone",
      settings: "Paramètres",
      notifications: "Notifications",
      availability: "Disponibilité",
    },
    relationship: {
      formal: { label: "Relation formelle", communication: "Mail professionnel" },
      terrain: { label: "Relation terrain", communication: "Messagerie rapide" },
      hybrid: { label: "Relation adaptée", communication: "Échange selon le partenaire" },
      contactFirst: { label: "Contact d'abord", communication: "Échange après contact" },
      partnerOnly: { label: "Partenaires validés", communication: "Réseau fermé" },
    },
    catalog: {
      title: "Catalogue",
      partner: "Catalogue partenaire",
      quickOrder: "Commander",
      discuss: "En discuter",
      empty: "Aucun produit visible pour l'instant",
    },
    orders: {
      title: "Commandes",
      status: {
        validated: "Validée",
        preparation: "En préparation",
        delivery: "En livraison",
        done: "Terminée",
      },
      quickAction: { ship: "Expédier", confirm: "Confirmer livraison" },
    },
    delivery: {
      title: "Livraison",
      reception: "Réception",
      confirm: "Confirmer réception",
      activity: "Suivi livraison",
    },
    wallet: {
      title: "Règlements",
      balance: "Solde",
      transaction: "Mouvement",
      actor: {
        producer: { balance: { label: "Solde partenaire" } },
        grossisteA: { balance: { label: "Règlement réseau" } },
        grossisteB: { balance: { label: "Règlement terrain" } },
        detaillant: { balance: { label: "Paiement" } },
      },
    },
    messaging: {
      title: "Messagerie",
      subtitle: "Échanges autour de vos ventes",
      linkedOrder: "Voir la commande",
      empty: "Aucune conversation pour l'instant",
    },
    mail: {
      title: "Mail professionnel",
      thread: "Fil partenaire",
      attachment: "Pièce jointe",
    },
    notifications: {
      title: "Notifications",
      enabled: "Activées",
      disabled: "Désactivées",
    },
    errors: {
      generic: "Un souci est survenu. Réessayez.",
      network: "Connexion instable. Vérifiez le réseau.",
      forbidden: "Action non autorisée pour cette relation.",
    },
    guardrails: {
      commerceFirst: "Flux commercial simple",
      noErp: "Pas de jargon entreprise",
    },
  },
  en: {
    common: {
      app: { name: "VENEXT", loading: "Loading…", refresh: "Refresh", back: "Back", save: "Save" },
      language: { label: "Language", fr: "Français", en: "English", ar: "العربية", zh: "中文" },
      empty: { title: "Nothing yet", hint: "Your activity will show here" },
    },
    navigation: {
      tabs: {
        activity: "Activity",
        messaging: "Messaging",
        wallet: "Settlements",
        catalog: "Catalog",
        orders: "Orders",
        network: "Network",
        profile: "Profile",
        home: "Home",
        products: "Products",
        account: "Account",
      },
      actor: {
        producer: { pole: { network: "Commercial network", orders: "Orders", mail: "Formal mail" } },
        grossisteA: { workspace: { orders: "Orders", distribution: "Distribution", network: "Network" } },
        grossisteB: { tab: { activity: "My activity", orders: "Orders" } },
        detaillant: { tab: { home: "Home", orders: "My orders" } },
      },
    },
    onboarding: {
      phone: { title: "Your number", hint: "To reach your field partners", cta: "Continue" },
      otp: { title: "Code received", hint: "Enter the SMS code", cta: "Verify" },
      identity: { title: "How to show up", pseudo: "Trade name", shop: "Shop (optional)" },
      city: { title: "Your city", hint: "For orders around you" },
      contacts: { title: "Contacts", allow: "Allow contacts access", skip: "Later" },
      autoAccept: { title: "Partner requests", on: "Auto-accept", off: "Review each request" },
    },
    identity: {
      profile: { title: "Profile", subtitle: "Commercial identity" },
      phone: "Phone",
      settings: "Settings",
      notifications: "Notifications",
      availability: "Availability",
    },
    relationship: {
      formal: { label: "Formal relationship", communication: "Professional mail" },
      terrain: { label: "Field relationship", communication: "Quick messaging" },
      hybrid: { label: "Adaptive relationship", communication: "Partner-fit exchange" },
      contactFirst: { label: "Contact first", communication: "Exchange after contact" },
      partnerOnly: { label: "Validated partners", communication: "Closed network" },
    },
    catalog: {
      title: "Catalog",
      partner: "Partner catalog",
      quickOrder: "Order",
      discuss: "Discuss",
      empty: "No visible products yet",
    },
    orders: {
      title: "Orders",
      status: {
        validated: "Validated",
        preparation: "In preparation",
        delivery: "Out for delivery",
        done: "Completed",
      },
      quickAction: { ship: "Ship", confirm: "Confirm delivery" },
    },
    delivery: {
      title: "Delivery",
      reception: "Reception",
      confirm: "Confirm receipt",
      activity: "Delivery tracking",
    },
    wallet: {
      title: "Settlements",
      balance: "Balance",
      transaction: "Movement",
      actor: {
        producer: { balance: { label: "Partner balance" } },
        grossisteA: { balance: { label: "Network settlement" } },
        grossisteB: { balance: { label: "Field settlement" } },
        detaillant: { balance: { label: "Payment" } },
      },
    },
    messaging: {
      title: "Messaging",
      subtitle: "Exchanges around your sales",
      linkedOrder: "View order",
      empty: "No conversations yet",
    },
    mail: {
      title: "Professional mail",
      thread: "Partner thread",
      attachment: "Attachment",
    },
    notifications: {
      title: "Notifications",
      enabled: "On",
      disabled: "Off",
    },
    errors: {
      generic: "Something went wrong. Try again.",
      network: "Unstable connection. Check your network.",
      forbidden: "Not allowed for this relationship.",
    },
    guardrails: {
      commerceFirst: "Simple commercial flow",
      noErp: "No enterprise jargon",
    },
  },
  ar: {
    common: {
      app: { name: "VENEXT", loading: "جاري التحميل…", refresh: "تحديث", back: "رجوع", save: "حفظ" },
      language: { label: "اللغة", fr: "Français", en: "English", ar: "العربية", zh: "中文" },
      empty: { title: "لا شيء حالياً", hint: "سيظهر نشاطك هنا" },
    },
    navigation: {
      tabs: {
        activity: "النشاط",
        messaging: "المراسلة",
        wallet: "التسويات",
        catalog: "الكتالوج",
        orders: "الطلبات",
        network: "الشبكة",
        profile: "الملف",
        home: "الرئيسية",
        products: "المنتجات",
        account: "الحساب",
      },
      actor: {
        producer: { pole: { network: "الشبكة التجارية", orders: "الطلبات", mail: "بريد رسمي" } },
        grossisteA: { workspace: { orders: "الطلبات", distribution: "التوزيع", network: "الشبكة" } },
        grossisteB: { tab: { activity: "نشاطي", orders: "الطلبات" } },
        detaillant: { tab: { home: "الرئيسية", orders: "طلباتي" } },
      },
    },
    onboarding: {
      phone: { title: "رقمك", hint: "للوصول إلى شركائك الميدانيين", cta: "متابعة" },
      otp: { title: "الرمز المستلم", hint: "أدخل رمز الرسالة", cta: "تأكيد" },
      identity: { title: "كيف تظهر", pseudo: "الاسم التجاري", shop: "المتجر (اختياري)" },
      city: { title: "مدينتك", hint: "للطلبات من حولك" },
      contacts: { title: "جهات الاتصال", allow: "السماح بالوصول", skip: "لاحقاً" },
      autoAccept: { title: "طلبات الشركاء", on: "قبول تلقائي", off: "مراجعة كل طلب" },
    },
    identity: {
      profile: { title: "الملف", subtitle: "الهوية التجارية" },
      phone: "الهاتف",
      settings: "الإعدادات",
      notifications: "الإشعارات",
      availability: "التوفر",
    },
    relationship: {
      formal: { label: "علاقة رسمية", communication: "بريد مهني" },
      terrain: { label: "علاقة ميدانية", communication: "مراسلة سريعة" },
      hybrid: { label: "علاقة مرنة", communication: "تواصل حسب الشريك" },
      contactFirst: { label: "جهة الاتصال أولاً", communication: "بعد إضافة جهة الاتصال" },
      partnerOnly: { label: "شركاء معتمدون", communication: "شبكة مغلقة" },
    },
    catalog: {
      title: "الكتالوج",
      partner: "كتالوج الشريك",
      quickOrder: "طلب",
      discuss: "مناقشة",
      empty: "لا منتجات ظاهرة حالياً",
    },
    orders: {
      title: "الطلبات",
      status: {
        validated: "مؤكدة",
        preparation: "قيد التحضير",
        delivery: "قيد التسليم",
        done: "منتهية",
      },
      quickAction: { ship: "شحن", confirm: "تأكيد التسليم" },
    },
    delivery: {
      title: "التسليم",
      reception: "الاستلام",
      confirm: "تأكيد الاستلام",
      activity: "متابعة التسليم",
    },
    wallet: {
      title: "التسويات",
      balance: "الرصيد",
      transaction: "حركة",
      actor: {
        producer: { balance: { label: "رصيد الشريك" } },
        grossisteA: { balance: { label: "تسوية الشبكة" } },
        grossisteB: { balance: { label: "تسوية ميدانية" } },
        detaillant: { balance: { label: "دفع" } },
      },
    },
    messaging: {
      title: "المراسلة",
      subtitle: "حول مبيعاتك",
      linkedOrder: "عرض الطلب",
      empty: "لا محادثات بعد",
    },
    mail: {
      title: "بريد مهني",
      thread: "سلسلة الشريك",
      attachment: "مرفق",
    },
    notifications: {
      title: "الإشعارات",
      enabled: "مفعّلة",
      disabled: "معطّلة",
    },
    errors: {
      generic: "حدث خطأ. أعد المحاولة.",
      network: "اتصال غير مستقر.",
      forbidden: "غير مسموح لهذه العلاقة.",
    },
    guardrails: {
      commerceFirst: "تدفق تجاري بسيط",
      noErp: "بلا مصطلحات مؤسسات",
    },
  },
  zh: {
    common: {
      app: { name: "VENEXT", loading: "加载中…", refresh: "刷新", back: "返回", save: "保存" },
      language: { label: "语言", fr: "Français", en: "English", ar: "العربية", zh: "中文" },
      empty: { title: "暂无内容", hint: "您的动态将显示在这里" },
    },
    navigation: {
      tabs: {
        activity: "动态",
        messaging: "消息",
        wallet: "结算",
        catalog: "目录",
        orders: "订单",
        network: "网络",
        profile: "资料",
        home: "首页",
        products: "产品",
        account: "账户",
      },
      actor: {
        producer: { pole: { network: "商业网络", orders: "订单", mail: "正式邮件" } },
        grossisteA: { workspace: { orders: "订单", distribution: "配送", network: "网络" } },
        grossisteB: { tab: { activity: "我的动态", orders: "订单" } },
        detaillant: { tab: { home: "首页", orders: "我的订单" } },
      },
    },
    onboarding: {
      phone: { title: "您的号码", hint: "联系现场伙伴", cta: "继续" },
      otp: { title: "收到验证码", hint: "输入短信验证码", cta: "验证" },
      identity: { title: "展示名称", pseudo: "商业昵称", shop: "店铺（可选）" },
      city: { title: "所在城市", hint: "用于附近订单" },
      contacts: { title: "通讯录", allow: "允许访问通讯录", skip: "稍后" },
      autoAccept: { title: "伙伴请求", on: "自动接受", off: "逐条审核" },
    },
    identity: {
      profile: { title: "资料", subtitle: "商业身份" },
      phone: "电话",
      settings: "设置",
      notifications: "通知",
      availability: "在线状态",
    },
    relationship: {
      formal: { label: "正式关系", communication: "商务邮件" },
      terrain: { label: "现场关系", communication: "快速消息" },
      hybrid: { label: "灵活关系", communication: "按伙伴适配" },
      contactFirst: { label: "先加联系人", communication: "联系后再沟通" },
      partnerOnly: { label: "已验证伙伴", communication: "封闭网络" },
    },
    catalog: {
      title: "目录",
      partner: "伙伴目录",
      quickOrder: "下单",
      discuss: "沟通",
      empty: "暂无可看产品",
    },
    orders: {
      title: "订单",
      status: {
        validated: "已确认",
        preparation: "备货中",
        delivery: "配送中",
        done: "已完成",
      },
      quickAction: { ship: "发货", confirm: "确认收货" },
    },
    delivery: {
      title: "配送",
      reception: "收货",
      confirm: "确认收货",
      activity: "配送跟踪",
    },
    wallet: {
      title: "结算",
      balance: "余额",
      transaction: "流水",
      actor: {
        producer: { balance: { label: "伙伴余额" } },
        grossisteA: { balance: { label: "网络结算" } },
        grossisteB: { balance: { label: "现场结算" } },
        detaillant: { balance: { label: "付款" } },
      },
    },
    messaging: {
      title: "消息",
      subtitle: "围绕您的销售交流",
      linkedOrder: "查看订单",
      empty: "暂无会话",
    },
    mail: {
      title: "商务邮件",
      thread: "伙伴线程",
      attachment: "附件",
    },
    notifications: {
      title: "通知",
      enabled: "已开启",
      disabled: "已关闭",
    },
    errors: {
      generic: "出现问题，请重试。",
      network: "网络不稳定。",
      forbidden: "此关系不允许该操作。",
    },
    guardrails: {
      commerceFirst: "简洁商业流程",
      noErp: "无企业术语",
    },
  },
};

for (const folder of ["fr", "en", "ar", "zh"]) {
  const dir = path.join(root, folder);
  fs.mkdirSync(dir, { recursive: true });
  for (const domain of domains) {
    const content = L[folder][domain];
    fs.writeFileSync(path.join(dir, `${domain}.json`), JSON.stringify(content, null, 2) + "\n");
  }
}

console.log("Locales seeded:", domains.length * 4, "files");
