import { useMemo } from "react";

export function usePoleField() {
  return useMemo(
    () => ({ fieldHints: ["network_density", "relationship_void"] as const }),
    [],
  );
}
