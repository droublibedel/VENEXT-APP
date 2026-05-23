import { memo } from "react";

import type { GrossisteHint } from "../mocks/grossiste-b-intelligence";

export const GrossisteHintStrip = memo(function GrossisteHintStrip({
  hints,
  testId = "grossiste-hints",
}: {
  hints: GrossisteHint[];
  testId?: string;
}) {
  if (!hints.length) return null;
  return (
    <div data-testid={testId}>
      {hints.map((h) => (
        <p key={h.id} className="grossiste-b-hint">
          {h.text}
        </p>
      ))}
    </div>
  );
});
