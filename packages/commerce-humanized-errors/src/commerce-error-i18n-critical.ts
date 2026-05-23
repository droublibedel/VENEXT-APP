import type { CommerceErrorKey } from "./commerce-humanized-errors.types";

/** Traductions critiques AR / ZH — plus de fallback FR sur erreurs sensibles (20.84-B). */
export const COMMERCE_ERROR_CRITICAL_AR: Partial<
  Record<CommerceErrorKey, { title: string; message: string }>
> = {
  network_unstable: {
    title: "اتصال غير مستقر",
    message: "يبدو أن الاتصال غير مستقر. تحقق من الإنترنت ثم أعد المحاولة.",
  },
  connection_timeout: {
    title: "انتهى الوقت",
    message: "الاستجابة تستغرق وقتاً أطول. أعد المحاولة بعد لحظة.",
  },
  session_expired: {
    title: "انتهت الجلسة",
    message: "أعد تسجيل الدخول لمتابعة نشاطك بأمان.",
  },
  access_suspended: {
    title: "الوصول موقوف مؤقتاً",
    message: "وصولك متوقف مؤقتاً. تواصل مع شريكك إذا لزم الأمر.",
  },
  access_denied: {
    title: "وصول محجوز",
    message: "هذا الإجراء محجوز لعلاقتك التجارية النشطة.",
  },
  relation_inactive: {
    title: "علاقة غير نشطة",
    message: "هذه العلاقة غير نشطة حالياً.",
  },
  wallet_locked: {
    title: "مساحة آمنة",
    message: "أكد وصولك لمتابعة التسويات.",
  },
  otp_invalid: {
    title: "رمز غير صحيح",
    message: "الرمز المدخل غير مطابق. تحقق وأعد المحاولة.",
  },
  password_incorrect: {
    title: "لم يتم التأكيد",
    message: "المعلومات المدخلة غير مطابقة. أعد المحاولة بهدوء.",
  },
  load_failed: {
    title: "تعذر التحميل",
    message: "تعذر تحميل المعلومات. أعد المحاولة.",
  },
  service_unavailable: {
    title: "الخدمة غير متاحة مؤقتاً",
    message: "مشكلة مؤقتة. أعد المحاولة لاحقاً.",
  },
  catalog_unavailable: {
    title: "الكتالوج غير متاح",
    message: "هذا الكتالوج غير متاح في هذا السياق حالياً.",
  },
  message_not_sent: {
    title: "لم يُرسل الرسالة",
    message: "تعذر إرسال رسالتك. تحقق من الاتصال وأعد المحاولة.",
  },
  delivery_unavailable: {
    title: "التسليم غير متاح",
    message: "متابعة التسليم غير متاحة حالياً.",
  },
  invalid_file: {
    title: "ملف غير مقبول",
    message: "لا يمكن استخدام هذا الملف هنا. اختر ملفاً آخر.",
  },
  image_error: {
    title: "تعذر عرض الصورة",
    message: "تعذر عرض الصورة. أعد المحاولة أو اختر صورة أخرى.",
  },
  sync_failed: {
    title: "مزامنة قيد الانتظار",
    message: "لم تكتمل المزامنة. ستستأنف عند استقرار الاتصال.",
  },
  cache_error: {
    title: "بيانات محلية",
    message: "أُعيد ضبط البيانات المحلية لسلامتك.",
  },
  not_found: {
    title: "معلومات غير متاحة",
    message: "هذه المعلومات غير متاحة حالياً.",
  },
  server_error: {
    title: "الخدمة غير متاحة مؤقتاً",
    message: "حدث خلل مؤقت. أعد المحاولة بعد قليل.",
  },
  runtime_error: {
    title: "توقف الإجراء",
    message: "تعذر إكمال الإجراء. أعد المحاولة.",
  },
  unexpected: {
    title: "مفاجأة بسيطة",
    message: "حدث أمر غير متوقع. لم يُفقد شيء — يمكنك إعادة المحاولة.",
  },
  offline: {
    title: "بدون اتصال",
    message: "يتطلب هذا الإجراء اتصالاً مستقراً بالإنترنت.",
  },
  wallet_action_failed: {
    title: "لم يكتمل الإجراء",
    message: "تعذر إتمام هذا الإجراء في الوقت الحالي.",
  },
  order_unavailable: {
    title: "الطلب غير متاح",
    message: "هذا الطلب غير متاح في هذا السياق.",
  },
  generic: {
    title: "الإجراء غير متاح",
    message: "هذا الإجراء غير متاح حالياً. أعد المحاولة.",
  },
};

export const COMMERCE_ERROR_CRITICAL_ZH: Partial<
  Record<CommerceErrorKey, { title: string; message: string }>
> = {
  network_unstable: {
    title: "网络不稳定",
    message: "连接似乎不稳定，请检查网络后重试。",
  },
  connection_timeout: {
    title: "请求超时",
    message: "响应时间较长，请稍后再试。",
  },
  session_expired: {
    title: "会话已结束",
    message: "请重新登录以安全地继续您的活动。",
  },
  access_suspended: {
    title: "访问已暂停",
    message: "您的访问已暂时暂停，如有需要请联系合作伙伴。",
  },
  access_denied: {
    title: "受限访问",
    message: "此操作仅限您当前活跃的商业关系。",
  },
  relation_inactive: {
    title: "关系未激活",
    message: "该关系目前未激活。",
  },
  wallet_locked: {
    title: "安全空间",
    message: "请确认访问权限以继续结算操作。",
  },
  otp_invalid: {
    title: "验证码不正确",
    message: "输入的验证码不匹配，请核对后重试。",
  },
  password_incorrect: {
    title: "未确认",
    message: "输入信息不匹配，请冷静地重试。",
  },
  load_failed: {
    title: "加载中断",
    message: "无法加载信息，请重试。",
  },
  service_unavailable: {
    title: "服务暂时不可用",
    message: "服务遇到临时问题，请稍后再试。",
  },
  catalog_unavailable: {
    title: "目录不可用",
    message: "此目录在当前上下文中暂不可用。",
  },
  message_not_sent: {
    title: "消息未发送",
    message: "消息未能发送，请检查连接后重试。",
  },
  delivery_unavailable: {
    title: "配送不可用",
    message: "配送跟踪暂不可用。",
  },
  invalid_file: {
    title: "文件不可用",
    message: "无法在此使用该文件，请选择其他文件。",
  },
  image_error: {
    title: "图片未显示",
    message: "无法显示图片，请重试或选择其他图片。",
  },
  sync_failed: {
    title: "同步等待中",
    message: "同步未完成，连接稳定后将自动继续。",
  },
  cache_error: {
    title: "本地数据",
    message: "已为您的安全重新初始化本地数据。",
  },
  not_found: {
    title: "信息不可用",
    message: "该信息目前不可用。",
  },
  server_error: {
    title: "服务暂时不可用",
    message: "出现临时问题，请稍后再试。",
  },
  runtime_error: {
    title: "操作中断",
    message: "操作未能正确完成，请重试。",
  },
  unexpected: {
    title: "小意外",
    message: "发生了意外情况，没有丢失数据，您可以重试。",
  },
  offline: {
    title: "离线",
    message: "此操作需要稳定的互联网连接。",
  },
  wallet_action_failed: {
    title: "操作未完成",
    message: "此操作目前未能完成。",
  },
  order_unavailable: {
    title: "订单不可用",
    message: "此订单在当前上下文中不可访问。",
  },
  generic: {
    title: "暂时无法操作",
    message: "当前无法完成此操作，请稍后再试。",
  },
};
