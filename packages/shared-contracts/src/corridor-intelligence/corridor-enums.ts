import { z } from "zod";

/** Mirrors `prisma/schema.prisma` — CommercialCorridorState (Instruction 20.4A strict contracts). */
export const COMMERCIAL_CORRIDOR_STATE_VALUES = [
  "INVITED",
  "PENDING_REVIEW",
  "ACCEPTED",
  "ACTIVE",
  "DEGRADED",
  "DORMANT",
  "RESTRICTED",
  "SUSPENDED",
  "BLOCKED",
  "TERMINATED",
] as const;

export const CommercialCorridorStateSchema = z.enum(COMMERCIAL_CORRIDOR_STATE_VALUES);

/** Mirrors `CommercialCorridorVisibility` in Prisma. */
export const COMMERCIAL_CORRIDOR_VISIBILITY_VALUES = [
  "STRICT_PRIVATE",
  "PARTNER_ONLY",
  "INTERNAL_ANALYTICS",
  "BACKOFFICE_ONLY",
] as const;

export const CommercialCorridorVisibilitySchema = z.enum(COMMERCIAL_CORRIDOR_VISIBILITY_VALUES);

/** Mirrors `CommercialCorridorSignalType` in Prisma. */
export const COMMERCIAL_CORRIDOR_SIGNAL_TYPE_VALUES = [
  "STABLE_ORDER_FLOW",
  "HIGH_NEGOTIATION_FRICTION",
  "DORMANT_CORRIDOR",
  "STRONG_PAYMENT_DISCIPLINE",
  "DELIVERY_INSTABILITY",
  "TRUST_DEGRADATION",
  "SPONSORED_CONVERSION_SUCCESS",
  "HIGH_ORDER_CANCELLATION",
  "RAPID_CORRIDOR_GROWTH",
  "LOW_ACTIVITY_WARNING",
  "RELATIONSHIP_CONFLICT_PATTERN",
  "COMMERCIAL_ALIGNMENT_STABLE",
] as const;

export const CommercialCorridorSignalTypeSchema = z.enum(COMMERCIAL_CORRIDOR_SIGNAL_TYPE_VALUES);

/** Instruction 20.4B — realtime fan-in change keys (not arbitrary strings). */
export const COMMERCIAL_CORRIDOR_REALTIME_CHANGE_TYPE_VALUES = [
  "STATE_CHANGED",
  "HEALTH_BAND_CHANGED",
  "SIGNALS_REBUILT",
  "SPONSORED_OUTCOME_APPLIED",
  "GOVERNANCE_RESTRICTED",
] as const;

export const CommercialCorridorRealtimeChangeTypeSchema = z.enum(COMMERCIAL_CORRIDOR_REALTIME_CHANGE_TYPE_VALUES);

export const CorridorRealtimeChangedItemSchema = z.union([
  CommercialCorridorSignalTypeSchema,
  CommercialCorridorRealtimeChangeTypeSchema,
]);

export type CommercialCorridorStateDto = z.infer<typeof CommercialCorridorStateSchema>;
export type CommercialCorridorVisibilityDto = z.infer<typeof CommercialCorridorVisibilitySchema>;
export type CommercialCorridorSignalTypeDto = z.infer<typeof CommercialCorridorSignalTypeSchema>;
