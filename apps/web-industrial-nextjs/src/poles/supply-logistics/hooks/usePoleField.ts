import { useMemo } from "react";

export function usePoleField() {
  return useMemo(
    () => ({ fieldHints: ["dwell", "eta_risk", "convoy"] as const }),
    [],
  );
}
