import { useMemo } from "react";

export function usePoleField() {
  return useMemo(
    () => ({ fieldHints: ["incident_envelope", "hydrant_geometry"] as const }),
    [],
  );
}
