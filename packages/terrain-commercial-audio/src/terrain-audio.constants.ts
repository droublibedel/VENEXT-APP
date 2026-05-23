/** Durée max présentation activité + description produit (GROSSISTE-B-03). */
export const MAX_BUSINESS_PROFILE_AUDIO_SECONDS = 90;
export const MAX_PRODUCT_VOICE_DESCRIPTION_SECONDS = 90;

export const TERRAIN_AUDIO_MAX_FILE_BYTES = 2_500_000;

export const SUPPORTED_TERRAIN_AUDIO_MIME_TYPES = [
  "audio/webm",
  "audio/ogg",
  "audio/mpeg",
  "audio/mp4",
] as const;

export const TERRAIN_AUDIO_DURATION_EXCEEDED_MESSAGE =
  "Votre présentation doit durer au maximum 1 minute 30.";

export const TERRAIN_AUDIO_UNAVAILABLE_MESSAGE =
  "L'audio n'est pas disponible pour le moment.";
