/** Offline / edge sync — foundation types for conflict resolver */

export type SyncEntityKind =
  | "ORDER_DRAFT"
  | "CATALOG_SNAPSHOT"
  | "MESSAGE_THREAD"
  | "WALLET_LEDGER_CACHE";

export interface SyncOperationFoundation {
  id: string;
  entityKind: SyncEntityKind;
  entityId: string;
  vectorClock: Record<string, number>;
  payloadVersion: string;
}

export type ConflictResolutionStrategy =
  | "SERVER_WINS"
  | "CLIENT_WINS"
  | "MERGE_FIELDWISE"
  | "DEFER_TO_OPERATOR";
