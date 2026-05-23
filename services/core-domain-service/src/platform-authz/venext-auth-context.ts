import { VENEXT_HEADER_ORG, VENEXT_HEADER_USER, type VenextRequestActor } from "./venext-authz.types";

/** Subset of Express `Request` used for auth parsing — avoids a hard dependency on `@types/express`. */
export type VenextHttpLike = {
  headers: Record<string, string | string[] | undefined>;
  query: Record<string, unknown>;
  params: Record<string, string | undefined>;
  body?: unknown;
};

export function parseVenextActorFromRequest(req: VenextHttpLike): VenextRequestActor {
  const userId = (req.headers[VENEXT_HEADER_USER] ?? req.headers["x-venext-user-id"]) as string | undefined;
  const headerOrg = (req.headers[VENEXT_HEADER_ORG] ??
    req.headers["x-venext-acting-organization-id"]) as string | undefined;
  const qAct = req.query["actingOrganizationId"];
  const queryOrg = typeof qAct === "string" ? qAct : Array.isArray(qAct) ? qAct[0] : undefined;
  const organizationId = (typeof headerOrg === "string" && headerOrg.trim() ? headerOrg.trim() : undefined) ?? queryOrg;
  const roleRaw = req.headers["x-venext-user-role"] ?? req.headers["x-venext-role"];
  const role =
    typeof roleRaw === "string" ? roleRaw.trim() : Array.isArray(roleRaw) ? roleRaw[0]?.trim() : undefined;
  const tokRaw = req.headers["x-venext-backoffice-token"];
  const backTok =
    typeof tokRaw === "string" ? tokRaw.trim() : Array.isArray(tokRaw) ? tokRaw[0]?.trim() : undefined;
  const expectedBo = process.env.VENEXT_BACKOFFICE_TOKEN?.trim() || "dev-backoffice-token";
  const backofficeCommercialTrustFull =
    role === "BACKOFFICE_ADMIN" || (backTok !== undefined && backTok === expectedBo);
  return {
    userId: typeof userId === "string" && userId.trim() ? userId.trim() : undefined,
    organizationId: typeof organizationId === "string" && organizationId.trim() ? organizationId.trim() : undefined,
    backofficeCommercialTrustFull,
  };
}

export function devAuthBypassEnabled(): boolean {
  return process.env.DEV_AUTH_BYPASS === "true" || process.env.DEV_AUTH_BYPASS === "1";
}

export function isProductionRuntime(): boolean {
  return process.env.NODE_ENV === "production";
}
