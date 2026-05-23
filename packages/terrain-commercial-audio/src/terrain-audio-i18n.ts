export type TerrainAudioLocale = "fr" | "en" | "ar" | "zh";

const LABELS: Record<TerrainAudioLocale, Record<string, string>> = {
  fr: {
    listenDescription: "Écouter la description",
    audioPresentation: "Présentation audio",
    recordPresentation: "Enregistrer ma présentation",
    recordProduct: "Décrire le produit à la voix",
    audioUnavailable: "Audio indisponible",
    maxDuration: "Durée maximum : 1 min 30",
    businessSection: "Présentation de mon activité",
    holdToRecord: "Maintenir pour enregistrer",
    deleteAudio: "Supprimer l'audio",
    replay: "Réécouter",
    pendingUpload: "À envoyer",
    invite: "Inviter",
  },
  en: {
    listenDescription: "Listen to description",
    audioPresentation: "Audio presentation",
    recordPresentation: "Record my presentation",
    recordProduct: "Describe product by voice",
    audioUnavailable: "Audio unavailable",
    maxDuration: "Maximum duration: 1 min 30",
    businessSection: "My business presentation",
    holdToRecord: "Hold to record",
    deleteAudio: "Delete audio",
    replay: "Listen again",
    pendingUpload: "Pending send",
    invite: "Invite",
  },
  ar: {
    listenDescription: "استمع إلى الوصف",
    audioPresentation: "عرض صوتي",
    recordPresentation: "تسجيل عرضي",
    recordProduct: "وصف المنتج صوتياً",
    audioUnavailable: "الصوت غير متاح",
    maxDuration: "المدة القصوى: دقيقة و30 ثانية",
    businessSection: "عرض نشاطي",
    holdToRecord: "اضغط مع الاستمرار للتسجيل",
    deleteAudio: "حذف الصوت",
    replay: "إعادة الاستماع",
    pendingUpload: "في انتظار الإرسال",
    invite: "دعوة",
  },
  zh: {
    listenDescription: "收听描述",
    audioPresentation: "语音介绍",
    recordPresentation: "录制我的介绍",
    recordProduct: "语音描述产品",
    audioUnavailable: "音频不可用",
    maxDuration: "最长时长：1分30秒",
    businessSection: "我的业务介绍",
    holdToRecord: "按住录音",
    deleteAudio: "删除音频",
    replay: "重新播放",
    pendingUpload: "待发送",
    invite: "邀请",
  },
};

export function tTerrainAudio(key: string, locale: TerrainAudioLocale = "fr"): string {
  return LABELS[locale][key] ?? LABELS.fr[key] ?? key;
}
