import { useMemo } from "react";

export function usePoleField() {
  return useMemo(
    () => ({ fieldHints: ["collection_pressure", "wallet_cadence"] as const }),
    [],
  );
}
