import { SetMetadata } from "@nestjs/common";

export const VENEXT_AUTHZ = "venext_authz" as const;

export type VenextAuthzRule =
  | { type: "orgRoute"; orgParam: string }
  | { type: "orgQuery"; queryKey: string }
  | { type: "relationshipRoute"; relationshipParam?: string }
  | { type: "contactSyncBodyUser" }
  | { type: "userSelfRoute"; userParam: string };

export const VenextAuthz = (rule: VenextAuthzRule) => SetMetadata(VENEXT_AUTHZ, rule);
