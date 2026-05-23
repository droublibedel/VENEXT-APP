import { memo } from "react";

import type { GrossisteAHint } from "../grossiste-a-intelligence";

export const GrossisteAHintList = memo(function GrossisteAHintList({
  hints,
  testId = "ga-hints",
}: {
  hints: GrossisteAHint[];
  testId?: string;
}) {
  if (!hints.length) return null;
  return (
    <div data-testid={testId}>
      {hints.map((h) => (
        <p key={h.id} className="ga-hint">
          {h.text}
        </p>
      ))}
    </div>
  );
});
