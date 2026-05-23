import type { RelationalFulfillmentTaskStatus } from "@prisma/client";

/** Instruction 20.19A — open fulfillment tasks included in corridor stress. */
export const ECONOMIC_GRAPH_OPEN_TASK_STATUSES: RelationalFulfillmentTaskStatus[] = [
  "OPEN",
  "IN_PROGRESS",
  "WAITING_EXTERNAL_CONFIRMATION",
  "WAITING_CORRIDOR_VALIDATION",
  "BLOCKED",
];

export const ECONOMIC_GRAPH_EXCLUDED_TASK_STATUSES: RelationalFulfillmentTaskStatus[] = [
  "COMPLETED",
  "CANCELLED",
];

export const ECONOMIC_GRAPH_OPEN_TASKS_SOURCE = "RELATIONAL_FULFILLMENT_TASK" as const;

/** Instruction 20.19A — bounded peer corridor scan (V1 honesty). */
export const ECONOMIC_GRAPH_PEER_SCAN_LIMIT = 15;

export const ECONOMIC_GRAPH_PEER_SCAN_MODE = "BOUNDED_V1" as const;

export const ECONOMIC_GRAPH_PEER_SCAN_WARNING = "PEER_SCAN_BOUNDED_V1" as const;
