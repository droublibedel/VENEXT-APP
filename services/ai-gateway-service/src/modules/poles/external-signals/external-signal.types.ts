export type ExternalSignalKind =
  | "weather"
  | "calendar"
  | "ramadan_window"
  | "public_holiday"
  | "traffic"
  | "geopolitical"
  | "internet_trend";

export type ExternalSignalSnapshot = {
  kind: ExternalSignalKind;
  providerId: string;
  zoneHint?: string;
  summary: string;
  confidence: number;
  validUntil?: string;
};

export type ExternalSignalFetchContext = {
  organizationId?: string;
  zoneCode?: string;
  locale?: string;
};
