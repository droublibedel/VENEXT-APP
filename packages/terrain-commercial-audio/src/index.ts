export {
  MAX_BUSINESS_PROFILE_AUDIO_SECONDS,
  MAX_PRODUCT_VOICE_DESCRIPTION_SECONDS,
  SUPPORTED_TERRAIN_AUDIO_MIME_TYPES,
  TERRAIN_AUDIO_DURATION_EXCEEDED_MESSAGE,
  TERRAIN_AUDIO_UNAVAILABLE_MESSAGE,
} from "./terrain-audio.constants.js";
export type {
  TerrainAudioAsset,
  TerrainAudioScopeType,
  TerrainAudioAssetStatus,
  TerrainAudioStorageMode,
  ProductVoiceDescriptionRecord,
  BusinessProfileAudioRecord,
  ProductMessagingContext,
  PartnerSuggestionAudioFields,
  TerrainAudioSpeakerState,
  TerrainAudioObservabilityEvent,
  TerrainAudioObservabilityEventName,
} from "./terrain-audio.types.js";
export {
  setTerrainAudioStorageMode,
  getTerrainAudioStorageMode,
  createTerrainAudioAsset,
  getTerrainAudioAsset,
  softDeleteTerrainAudioAsset,
  getProductVoiceDescription,
  getBusinessProfileAudio,
  clampTerrainAudioDuration,
  listPendingTerrainAudioUploads,
  markTerrainAudioUploadReady,
  resetTerrainAudioStorageForTests,
} from "./terrain-audio-storage.js";
export {
  requestTerrainAudioPlayback,
  pauseTerrainAudioPlayback,
  stopAllTerrainAudioPlayback,
  getActiveTerrainAudioPlaybackId,
  isTerrainAudioPlaying,
  subscribeTerrainAudioPlayback,
} from "./terrain-audio-playback.js";
export { tTerrainAudio, type TerrainAudioLocale } from "./terrain-audio-i18n.js";
export {
  trackTerrainAudioEvent,
  configureTerrainAudioObservabilityReporter,
  drainTerrainAudioObservabilityEvents,
  resetTerrainAudioObservabilityForTests,
} from "./terrain-audio-observability.js";
export {
  postTerrainAudio,
  getTerrainAudioById,
  deleteTerrainAudio,
  attachProductAudioDescription,
  deleteProductAudioDescription,
  saveBusinessProfileAudio,
  deleteBusinessProfileAudio,
  fetchPartnerSuggestions,
} from "./terrain-audio-api-client.js";
export { VenextAudioSpeakerButton } from "./VenextAudioSpeakerButton.js";
export { TerrainAudioHoldRecorder, type TerrainAudioRecordResult } from "./TerrainAudioHoldRecorder.js";
export { ProductVoiceDescription } from "./ProductVoiceDescription.js";
export { BusinessProfileAudioSection } from "./BusinessProfileAudioSection.js";
export { PartnerSuggestionCatalogPreview } from "./PartnerSuggestionCatalogPreview.js";
export {
  buildProductMessagingContext,
  getProductMessagingContext,
  setProductMessagingContext,
  resetProductMessagingContextForTests,
} from "./product-messaging-context.js";
export {
  auditTerrainAudioProductDescription,
  auditBusinessProfileAudio,
  auditPartnerSuggestionAudioVisibility,
  auditTerrainAudioPerformance,
  auditTerrainAudioPrivacy,
} from "./audit/terrain-audio-audits.js";
