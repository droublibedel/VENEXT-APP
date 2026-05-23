import { useMemo } from "react";

export function usePoleField() {
  return useMemo(
    () => ({ fieldHints: ["order_flow", "negotiation_heat"] as const }),
    [],
  );
}
