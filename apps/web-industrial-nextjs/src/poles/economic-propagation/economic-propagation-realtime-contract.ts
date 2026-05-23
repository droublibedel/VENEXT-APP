/** Contract surface for Instruction 18.1 realtime (demo + live). */
export const ECONOMIC_PROPAGATION_REALTIME_EVENT_TYPES = [
  "demo.economic_propagation.shock.detected",
  "demo.economic_propagation.chain.updated",
  "demo.economic_propagation.territory.fragile",
  "live.economic_propagation.shock.detected",
  "live.economic_propagation.chain.updated",
  "live.economic_propagation.territory.fragile",
] as const;
