import type { CommercialLocationProfile } from "./commercial-location.types.js";

export type CommercialLocationApiClient = {
  getMe(actorId: string): Promise<CommercialLocationProfile | null>;
  post(body: Partial<CommercialLocationProfile> & { actorId: string }): Promise<CommercialLocationProfile>;
  patch(actorId: string, body: Partial<CommercialLocationProfile>): Promise<CommercialLocationProfile | null>;
};

export function createCommercialLocationApi(baseUrl: string): CommercialLocationApiClient {
  const root = baseUrl.replace(/\/$/, "");
  return {
    async getMe(actorId) {
      const res = await fetch(`${root}/api/commercial-location/me?actorId=${encodeURIComponent(actorId)}`);
      if (res.status === 404) return null;
      if (!res.ok) throw new Error("commercial_location_get_failed");
      return res.json() as Promise<CommercialLocationProfile>;
    },
    async post(body) {
      const res = await fetch(`${root}/api/commercial-location`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error("commercial_location_post_failed");
      return res.json() as Promise<CommercialLocationProfile>;
    },
    async patch(actorId, body) {
      const res = await fetch(`${root}/api/commercial-location`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ actorId, ...body }),
      });
      if (!res.ok) throw new Error("commercial_location_patch_failed");
      return res.json() as Promise<CommercialLocationProfile>;
    },
  };
}
