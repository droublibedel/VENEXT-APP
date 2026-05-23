import { useMemo } from "react";

export function usePoleField() {
  return useMemo(
    () => ({ fieldHints: ["operational_demo", "instruction_5"] as const }),
    [],
  );
}
