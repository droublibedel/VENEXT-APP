export type TerrainAudioScopeType =
  | "PRODUCT_DESCRIPTION"
  | "BUSINESS_PROFILE"
  | "MESSAGE_VOICE_NOTE";

export type TerrainAudioAssetStatus = "pending" | "ready" | "failed" | "deleted";

export type TerrainAudioStorageMode = "LOCAL_DEV" | "MOCK_URL" | "FUTURE_OBJECT_STORAGE";

export type TerrainAudioAsset = {
  id: string;
  ownerActorId: string;
  scopeType: TerrainAudioScopeType;
  scopeId: string;
  audioUrl: string;
  durationSeconds: number;
  mimeType: string;
  sizeBytes: number;
  waveformData?: number[];
  status: TerrainAudioAssetStatus;
  createdAt: string;
  deletedAt?: string | null;
};

/** Contrat audio produit (GROSSISTE-B-03). */
export type ProductVoiceDescriptionRecord = {
  id: string;
  productId: string;
  ownerActorId: string;
  audioUrl: string;
  durationSeconds: number;
  waveform?: number[];
  createdAt: string;
  deletedAt?: string | null;
  status: TerrainAudioAssetStatus;
};

export type BusinessProfileAudioRecord = {
  id: string;
  ownerActorId: string;
  audioUrl: string;
  durationSeconds: number;
  optionalText?: string;
  waveform?: number[];
  createdAt: string;
  deletedAt?: string | null;
  status: TerrainAudioAssetStatus;
};

export type ProductMessagingContext = {
  productId: string;
  productImage?: string;
  productAudioDescriptionId?: string;
  supplierId: string;
  relationshipId?: string;
};

export type PartnerSuggestionAudioFields = {
  businessAudioId?: string;
  businessAudioUrl?: string;
  businessAudioDurationSeconds?: number;
  catalogPreviewImageUrls?: string[];
  partnerRoleLabel?: string;
};

export type TerrainAudioSpeakerState = "ready" | "playing" | "paused" | "loading" | "error";

export type TerrainAudioObservabilityEventName =
  | "audio_product_record_started"
  | "audio_product_record_completed"
  | "audio_product_deleted"
  | "business_audio_record_completed"
  | "audio_play_failed"
  | "audio_upload_failed";

export type TerrainAudioObservabilityEvent = {
  name: TerrainAudioObservabilityEventName;
  metadata: Record<string, string | number | boolean>;
  at: string;
};
