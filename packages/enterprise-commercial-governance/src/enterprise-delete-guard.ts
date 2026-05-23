/** Instruction 20.86-B — aucune suppression physique des comptes industriels */

export class EnterpriseHardDeleteForbiddenError extends Error {
  constructor(entity: string) {
    super(`ENTERPRISE_HARD_DELETE_FORBIDDEN:${entity}`);
    this.name = "EnterpriseHardDeleteForbiddenError";
  }
}

export function preventHardDelete(entityLabel: string): never {
  throw new EnterpriseHardDeleteForbiddenError(entityLabel);
}

export type ArchiveInsteadOfDeleteResult<T> = {
  archived: true;
  entity: T;
  archivedAt: string;
  archiveReason?: string;
};

export function archiveInsteadOfDelete<T extends Record<string, unknown>>(
  entity: T,
  archiveReason?: string,
): ArchiveInsteadOfDeleteResult<T> {
  return {
    archived: true,
    entity: { ...entity, archivedAt: new Date().toISOString() },
    archivedAt: new Date().toISOString(),
    archiveReason,
  };
}

export function assertNoPhysicalDelete(operation: "delete" | "remove" | "purge"): void {
  if (operation === "delete" || operation === "remove" || operation === "purge") {
    preventHardDelete("industrial_account");
  }
}
