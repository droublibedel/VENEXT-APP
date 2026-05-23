import { memo } from "react";

import type { DetaillantHint } from "../detaillant-intelligence";

export const DetaillantHintStrip = memo(function DetaillantHintStrip({
  hints,
  testId = "detaillant-hints",
}: {
  hints: DetaillantHint[];
  testId?: string;
}) {
  if (!hints.length) return null;
  return (
    <div data-testid={testId}>
      {hints.map((h) => (
        <p key={h.id} className="detaillant-hint">
          {h.text}
        </p>
      ))}
    </div>
  );
});
