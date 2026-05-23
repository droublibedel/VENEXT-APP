/**
 * Store BFF — délègue à la même logique que terrain-commercial-audio (copie légère pour Node).
 * En prod : proxy vers core-domain ; en V1 : mémoire process.
 */

export type BffTerrainAudioAsset = {
  id: string;
  ownerActorId: string;
  scopeType: "PRODUCT_DESCRIPTION" | "BUSINESS_PROFILE" | "MESSAGE_VOICE_NOTE";
  scopeId: string;
  audioUrl: string;
  durationSeconds: number;
  mimeType: string;
  sizeBytes: number;
  waveformData?: number[];
  status: "pending" | "ready" | "failed" | "deleted";
  createdAt: string;
  deletedAt?: string | null;
};

const assets = new Map<string, BffTerrainAudioAsset>();
const productAudio = new Map<string, string>();
const profileAudio = new Map<string, string>();

const MAX_SEC = 90;

function urlFor(id: string): string {
  return `https://mock.venext.ci/terrain-audio/${id}.webm`;
}

export function bffCreateTerrainAudio(input: {
  ownerActorId: string;
  scopeType: BffTerrainAudioAsset["scopeType"];
  scopeId: string;
  durationSeconds: number;
  mimeType?: string;
  waveformData?: number[];
}): BffTerrainAudioAsset {
  const durationSeconds = Math.min(MAX_SEC, Math.max(0.3, input.durationSeconds));
  const id = `bff-ta-${Date.now()}`;
  const asset: BffTerrainAudioAsset = {
    id,
    ownerActorId: input.ownerActorId,
    scopeType: input.scopeType,
    scopeId: input.scopeId,
    audioUrl: urlFor(id),
    durationSeconds,
    mimeType: input.mimeType ?? "audio/webm",
    sizeBytes: 100_000,
    waveformData: input.waveformData,
    status: "ready",
    createdAt: new Date().toISOString(),
    deletedAt: null,
  };
  assets.set(id, asset);
  if (input.scopeType === "PRODUCT_DESCRIPTION") productAudio.set(input.scopeId, id);
  if (input.scopeType === "BUSINESS_PROFILE") profileAudio.set(input.ownerActorId, id);
  return asset;
}

export function bffGetTerrainAudio(id: string): BffTerrainAudioAsset | null {
  const a = assets.get(id);
  if (!a || a.deletedAt) return null;
  return a;
}

export function bffDeleteTerrainAudio(id: string): boolean {
  const a = assets.get(id);
  if (!a) return false;
  a.deletedAt = new Date().toISOString();
  a.status = "deleted";
  if (a.scopeType === "PRODUCT_DESCRIPTION") productAudio.delete(a.scopeId);
  if (a.scopeType === "BUSINESS_PROFILE") profileAudio.delete(a.ownerActorId);
  return true;
}

export function bffGetProductAudio(productId: string) {
  const id = productAudio.get(productId);
  if (!id) return null;
  const a = bffGetTerrainAudio(id);
  if (!a) return null;
  return {
    id: a.id,
    productId,
    ownerActorId: a.ownerActorId,
    audioUrl: a.audioUrl,
    durationSeconds: a.durationSeconds,
    waveform: a.waveformData,
    createdAt: a.createdAt,
    status: a.status,
  };
}

export function bffGetProfileAudio(ownerActorId: string) {
  const id = profileAudio.get(ownerActorId);
  if (!id) return null;
  const a = bffGetTerrainAudio(id);
  if (!a) return null;
  return {
    id: a.id,
    ownerActorId,
    audioUrl: a.audioUrl,
    durationSeconds: a.durationSeconds,
    createdAt: a.createdAt,
    status: a.status,
  };
}

export function bffPartnerSuggestions(): Array<{
  id: string;
  displayName: string;
  partnerRoleLabel: string;
  city: string;
  businessAudioId?: string;
  businessAudioUrl?: string;
  businessAudioDurationSeconds?: number;
  catalogPreviewImageUrls?: string[];
}> {
  return [
    {
      id: "sug-gb-1",
      displayName: "Moussa Grossiste",
      partnerRoleLabel: "Grossiste",
      city: "Adjamé",
      businessAudioId: "demo-ba-1",
      businessAudioUrl: urlFor("demo-ba-1"),
      businessAudioDurationSeconds: 45,
      catalogPreviewImageUrls: ["https://mock.venext.ci/p1.jpg", "https://mock.venext.ci/p2.jpg"],
    },
    {
      id: "sug-det-1",
      displayName: "Kony Boutique",
      partnerRoleLabel: "Détaillant",
      city: "Yopougon",
      catalogPreviewImageUrls: [],
    },
  ];
}

export function resetBffTerrainAudioStore(): void {
  assets.clear();
  productAudio.clear();
  profileAudio.clear();
}
