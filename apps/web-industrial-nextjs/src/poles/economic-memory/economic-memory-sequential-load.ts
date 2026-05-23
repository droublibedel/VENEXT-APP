/** Instruction 18.2 — ordered client reads for economic memory pole (sequential-load contract). */
export const ECONOMIC_MEMORY_SEQUENTIAL_LOAD_STEPS = [
  "/v1/economic-memory/bundle",
  "/v1/economic-memory/history",
  "/v1/economic-memory/shock-patterns",
  "/v1/economic-memory/crisis-signatures",
] as const;
