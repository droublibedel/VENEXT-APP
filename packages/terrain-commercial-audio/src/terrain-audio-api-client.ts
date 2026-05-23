import type { BusinessProfileAudioRecord, ProductVoiceDescriptionRecord, TerrainAudioAsset } from "./terrain-audio.types.js";

export type TerrainAudioApiConfig = {
  bffBaseUrl: string;
  actorId?: string;
};

async function parseJson<T>(res: Response): Promise<T> {
  if (!res.ok) throw new Error(`terrain-audio-api-${res.status}`);
  return res.json() as Promise<T>;
}

export async function postTerrainAudio(
  cfg: TerrainAudioApiConfig,
  body: {
    scopeType: string;
    scopeId: string;
    durationSeconds: number;
    mimeType?: string;
    waveformData?: number[];
  },
): Promise<TerrainAudioAsset> {
  const res = await fetch(`${cfg.bffBaseUrl}/api/terrain-audio`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ownerActorId: cfg.actorId, ...body }),
  });
  return parseJson(res);
}

export async function getTerrainAudioById(cfg: TerrainAudioApiConfig, id: string): Promise<TerrainAudioAsset> {
  const res = await fetch(`${cfg.bffBaseUrl}/api/terrain-audio/${encodeURIComponent(id)}`);
  return parseJson(res);
}

export async function deleteTerrainAudio(cfg: TerrainAudioApiConfig, id: string): Promise<void> {
  await fetch(`${cfg.bffBaseUrl}/api/terrain-audio/${encodeURIComponent(id)}`, { method: "DELETE" });
}

export async function attachProductAudioDescription(
  cfg: TerrainAudioApiConfig,
  productId: string,
  body: { durationSeconds: number; mimeType?: string },
): Promise<ProductVoiceDescriptionRecord> {
  const res = await fetch(
    `${cfg.bffBaseUrl}/api/grossiste-b/products/${encodeURIComponent(productId)}/audio-description`,
    { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) },
  );
  return parseJson(res);
}

export async function deleteProductAudioDescription(
  cfg: TerrainAudioApiConfig,
  productId: string,
): Promise<void> {
  await fetch(
    `${cfg.bffBaseUrl}/api/grossiste-b/products/${encodeURIComponent(productId)}/audio-description`,
    { method: "DELETE" },
  );
}

export async function saveBusinessProfileAudio(
  cfg: TerrainAudioApiConfig,
  body: { durationSeconds: number; optionalText?: string },
): Promise<BusinessProfileAudioRecord> {
  const res = await fetch(`${cfg.bffBaseUrl}/api/grossiste-b/profile/business-audio`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return parseJson(res);
}

export async function deleteBusinessProfileAudio(cfg: TerrainAudioApiConfig): Promise<void> {
  await fetch(`${cfg.bffBaseUrl}/api/grossiste-b/profile/business-audio`, { method: "DELETE" });
}

export type PartnerSuggestionDto = {
  id: string;
  displayName: string;
  businessAudioId?: string;
  businessAudioUrl?: string;
  businessAudioDurationSeconds?: number;
  catalogPreviewImageUrls?: string[];
  partnerRoleLabel?: string;
};

export async function fetchPartnerSuggestions(
  cfg: TerrainAudioApiConfig,
): Promise<PartnerSuggestionDto[]> {
  const res = await fetch(`${cfg.bffBaseUrl}/api/partner-suggestions`);
  const data = await parseJson<{ suggestions: PartnerSuggestionDto[] }>(res);
  return data.suggestions ?? [];
}
