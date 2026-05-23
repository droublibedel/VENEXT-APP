/** Parsed from headers — JWT can populate the same shape later (Instruction 9B). */
export type VenextRequestActor = {
  userId?: string;
  /** Acting org for relationship / org-scoped routes */
  organizationId?: string;
  /**
   * Instruction 20.3 — back-office / admin may read private economic trust for any org
   * (x-venext-user-role: BACKOFFICE_ADMIN or valid x-venext-backoffice-token).
   */
  backofficeCommercialTrustFull?: boolean;
};

export const VENEXT_HEADER_USER = "x-venext-user-id";
export const VENEXT_HEADER_ORG = "x-venext-acting-organization-id";
