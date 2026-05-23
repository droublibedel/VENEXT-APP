import type {
  EnterpriseGovernanceHistoryEntry,
  EnterpriseSecurityActionType,
  GovernanceLevel,
} from "./enterprise-governance.types";

const history: EnterpriseGovernanceHistoryEntry[] = [];

function historyId(): string {
  return `egh-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

/** Append-only — seule écriture autorisée (Instruction 20.86-D). */
export function appendGovernanceHistoryEvent(
  input: Omit<EnterpriseGovernanceHistoryEntry, "id" | "createdAt">,
): EnterpriseGovernanceHistoryEntry {
  return appendGovernanceHistory(input);
}

export function appendGovernanceHistory(input: Omit<EnterpriseGovernanceHistoryEntry, "id" | "createdAt">): EnterpriseGovernanceHistoryEntry {
  const entry: EnterpriseGovernanceHistoryEntry = {
    ...input,
    id: historyId(),
    createdAt: new Date().toISOString(),
  };
  history.push(entry);
  return entry;
}

export function listGovernanceHistory(enterpriseId: string): EnterpriseGovernanceHistoryEntry[] {
  return history.filter((h) => h.enterpriseId === enterpriseId);
}

export function listAllGovernanceHistory(): EnterpriseGovernanceHistoryEntry[] {
  return [...history];
}

/** Historique immuable — toute mutation est interdite */
export function mutateGovernanceHistory(_id: string, _patch: Partial<EnterpriseGovernanceHistoryEntry>): never {
  preventHistoryMutation();
}

export function updateGovernanceHistory(_id: string, _patch: Partial<EnterpriseGovernanceHistoryEntry>): never {
  preventHistoryMutation();
}

export function deleteGovernanceHistory(_id: string): never {
  preventHistoryMutation();
}

function preventHistoryMutation(): never {
  throw new Error("ENTERPRISE_GOVERNANCE_HISTORY_IMMUTABLE");
}

export function buildHistoryEntryFromAction(input: {
  enterpriseId: string;
  action: EnterpriseSecurityActionType;
  author: string;
  authorLevel: GovernanceLevel;
  target: string;
  note: string;
  document?: string;
  previousState: string;
  newState: string;
}): EnterpriseGovernanceHistoryEntry {
  return appendGovernanceHistory(input);
}

export function resetGovernanceHistoryStorage(): void {
  history.length = 0;
}
