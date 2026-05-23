import { useMemo } from "react";

export function usePoleField() {
  return useMemo(
    () => ({ fieldHints: ["correlation", "anomaly_cone"] as const }),
    [],
  );
}
