import type { TerrainSearchResponse } from "commerce-ux-harmony";

import { GROSSISTE_B_ORG_ID } from "../mocks/grossiste-b-mock-data";

export async function fetchTerrainGlobalSearch(
  query: string,
  organizationId: string,
  actorRole: "DETAILLANT" | "GROSSISTE_B",
): Promise<TerrainSearchResponse> {
  const params = new URLSearchParams({
    q: query,
    organizationId: organizationId || GROSSISTE_B_ORG_ID,
    role: actorRole,
  });
  const res = await fetch(`/api/terrain/search?${params.toString()}`, {
    credentials: "include",
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`search_http_${res.status}`);
  const body = (await res.json()) as { payload?: TerrainSearchResponse } & TerrainSearchResponse;
  return body.payload ?? body;
}
