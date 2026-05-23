import { useCallback, useState } from "react";

import { humanizeCommerceError } from "./commerce-humanized-errors";
import type { HumanizeErrorOptions, HumanizedCommerceError } from "./commerce-humanized-errors.types";

export function useCommerceHumanizedError(options: HumanizeErrorOptions = {}) {
  const [error, setError] = useState<HumanizedCommerceError | null>(null);

  const capture = useCallback(
    (e: unknown, override?: HumanizeErrorOptions) => {
      const h = humanizeCommerceError(e, { ...options, ...override });
      setError(h);
      return h;
    },
    [options],
  );

  const clear = useCallback(() => setError(null), []);

  const runSafe = useCallback(
    async <T,>(action: () => Promise<T>): Promise<T | null> => {
      try {
        clear();
        return await action();
      } catch (e) {
        capture(e);
        return null;
      }
    },
    [capture, clear],
  );

  return { error, capture, clear, runSafe, setError };
}
