import { useCallback, useEffect, useState } from "react";

export type TransientLocationOptimizationHintProps = {
  message: string;
  visibleMs?: number;
  onDismiss?: () => void;
  "data-testid"?: string;
};

export function TransientLocationOptimizationHint({
  message,
  visibleMs = 5000,
  onDismiss,
  "data-testid": testId = "transient-location-hint",
}: TransientLocationOptimizationHintProps) {
  const [visible, setVisible] = useState(true);
  const [fading, setFading] = useState(false);

  const dismiss = useCallback(() => {
    setFading(true);
    window.setTimeout(() => {
      setVisible(false);
      onDismiss?.();
    }, 300);
  }, [onDismiss]);

  useEffect(() => {
    const fadeTimer = window.setTimeout(() => setFading(true), Math.max(visibleMs - 400, 0));
    const hideTimer = window.setTimeout(() => dismiss(), visibleMs);
    return () => {
      window.clearTimeout(fadeTimer);
      window.clearTimeout(hideTimer);
    };
  }, [dismiss, visibleMs]);

  if (!visible) return null;

  return motionlessHintView({ testId, message, fading, onDismiss: dismiss });
}

function motionlessHintView({
  testId,
  message,
  fading,
  onDismiss,
}: {
  testId: string;
  message: string;
  fading: boolean;
  onDismiss: () => void;
}) {
  return (
    <div
      data-testid={testId}
      role="status"
      aria-live="polite"
      style={{
        position: "fixed",
        top: 56,
        left: 12,
        right: 12,
        zIndex: 90,
        padding: "10px 12px",
        borderRadius: 10,
        background: "var(--venext-surface, #fff)",
        border: "1px solid var(--venext-border, #e2e6ea)",
        boxShadow: "0 8px 24px rgba(23, 32, 28, 0.08)",
        fontSize: 13,
        lineHeight: 1.4,
        color: "var(--venext-text-secondary, #4a5c54)",
        opacity: fading ? 0 : 1,
        transform: fading ? "translateY(-6px)" : "translateY(0)",
        transition: "opacity 0.3s ease, transform 0.3s ease",
        display: "flex",
        alignItems: "flex-start",
        gap: 8,
      }}
    >
      <span style={{ flex: 1 }}>{message}</span>
      <button
        type="button"
        aria-label="Fermer"
        data-testid={`${testId}-close`}
        onClick={onDismiss}
        style={{
          border: "none",
          background: "transparent",
          color: "var(--venext-text-muted, #7a8a82)",
          fontSize: 16,
          lineHeight: 1,
          padding: 0,
          cursor: "pointer",
        }}
      >
        ×
      </button>
    </div>
  );
}
