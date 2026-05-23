export type CommercialLocationSourceType = "GPS" | "MANUAL_CITY" | "SYSTEM_INFERRED";

export type CommercialLocationProfile = {
  actorId: string;
  city?: string;
  district?: string;
  region?: string;
  country?: string;
  latitude?: number;
  longitude?: number;
  accuracyMeters?: number;
  sourceType: CommercialLocationSourceType;
  gpsValidatedAt?: string;
  updatedAt: string;
};

/** Données publiques — jamais lat/lng brutes. */
export type CommercialLocationPublicView = {
  city?: string;
  district?: string;
  proximityLabel?: string;
  region?: string;
};

export type GpsCaptureResult = {
  latitude: number;
  longitude: number;
  accuracyMeters: number;
  timestamp: string;
};

export type ReverseGeocodeResult = {
  city?: string;
  district?: string;
  region?: string;
  country?: string;
};

export type SoftLocationPromptTrigger =
  | "after_onboarding"
  | "first_session"
  | "after_catalog_publish"
  | "after_relation"
  | "before_advanced_recommendations";
