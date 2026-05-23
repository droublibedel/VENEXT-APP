/** Champs produit — tous optionnels sauf image (GROSSISTE-B-02). */
export type TerrainProductDraft = {
  id: string;
  imageUrl: string;
  name?: string;
  description?: string;
  size?: string;
  color?: string;
  priceLabel?: string;
  stockLabel?: string;
  category?: string;
  voiceDescriptionUrl?: string;
  voiceDescriptionId?: string;
  voiceWaveform?: number[];
  voiceDurationSec?: number;
  galleryImageUrls?: string[];
};

export type MultiImageDispatchMode = "same_article" | "different_articles";

export type TerrainPublishBatch = {
  imageUrls: string[];
  dispatchMode: MultiImageDispatchMode;
  optionalText?: string;
  optionalVoice?: { durationSec: number; waveform: number[] };
};
