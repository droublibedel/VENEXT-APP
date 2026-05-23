import { useMemo } from "react";

export function usePoleField() {
  return useMemo(
    () => ({ fieldHints: ["diffusion", "attention_gravity"] as const }),
    [],
  );
}
