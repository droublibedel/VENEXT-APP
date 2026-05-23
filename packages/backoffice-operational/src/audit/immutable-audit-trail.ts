import { getBackofficeAuditRepository } from "../repositories/backoffice-audit.repository.js";
import type { BackofficeInternalAuditEntry } from "../types/audit.types.js";

/** Append-only — aucune mutation (Instruction BACKOFFICE-01-A). */
export async function immutableBackofficeAuditTrail(
  input: Omit<BackofficeInternalAuditEntry, "id" | "at">,
): Promise<BackofficeInternalAuditEntry> {
  return getBackofficeAuditRepository().append({
    ...input,
    metadata: {
      ...input.metadata,
      immutable: true,
      contextSignature: `bo-${Date.now()}`,
    },
  });
}

export function rejectAuditMutation(): never {
  throw new Error("BACKOFFICE_AUDIT_IMMUTABLE");
}
