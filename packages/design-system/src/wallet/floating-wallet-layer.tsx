import type { HTMLAttributes, ReactNode } from "react";
import { venextTokens } from "../tokens";

export interface FloatingWalletLayerProps extends HTMLAttributes<HTMLDivElement> {
  open: boolean;
  onRequestClose?: () => void;
  children: ReactNode;
  /** NFC-ready tap targets surface above catalog without hiding context */
  nfcZone?: ReactNode;
  qrSlot?: ReactNode;
}

/**
 * Wallet floats above commerce — catalog stays perceptually “behind” via scrim.
 * Slide-down entry, instant access, not a separate banking app.
 */
export function FloatingWalletLayer({
  open,
  onRequestClose,
  children,
  nfcZone,
  qrSlot,
  style,
  ...rest
}: FloatingWalletLayerProps) {
  return (
    <div
      data-vx-wallet-layer
      style={{
        position: "fixed",
        inset: 0,
        pointerEvents: open ? "auto" : "none",
        zIndex: venextTokens.elevation.transactional,
        ...style,
      }}
      {...rest}
    >
      <button
        type="button"
        aria-label="Close wallet layer"
        onClick={onRequestClose}
        style={{
          position: "absolute",
          inset: 0,
          border: "none",
          background: open ? "rgba(15,26,23,0.45)" : "transparent",
          opacity: open ? 1 : 0,
          transition: "opacity var(--vx-motion-fast,140ms) var(--vx-motion-ease,cubic-bezier(0.22,1,0.36,1))",
        }}
      />
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: 0,
          transform: open ? "translateY(0)" : "translateY(-110%)",
          transition:
            "transform var(--vx-motion-medium,200ms) var(--vx-motion-ease,cubic-bezier(0.22,1,0.36,1))",
          background: venextTokens.color.neutral.white,
          borderBottom: `1px solid ${venextTokens.color.neutral.line}`,
          boxShadow: "0 12px 40px rgba(15,26,23,0.18)",
          padding: venextTokens.space.lg,
          fontFamily: venextTokens.font.sans,
        }}
      >
        <div
          style={{
            display: "flex",
            gap: venextTokens.space.md,
            alignItems: "flex-start",
            justifyContent: "space-between",
          }}
        >
          <div style={{ flex: 1 }}>{children}</div>
          <div
            style={{
              minWidth: 160,
              display: "grid",
              gap: venextTokens.space.sm,
              justifyItems: "stretch",
            }}
          >
            {qrSlot ? (
              <div
                data-vx-qr-slot
                style={{
                  borderRadius: venextTokens.radius.md,
                  border: `1px dashed ${venextTokens.color.secondary}`,
                  padding: venextTokens.space.sm,
                  textAlign: "center",
                  fontSize: 11,
                  color: venextTokens.color.neutral.graphiteMuted,
                }}
              >
                {qrSlot}
              </div>
            ) : null}
            {nfcZone ? (
              <div
                data-vx-nfc-zone
                style={{
                  borderRadius: venextTokens.radius.md,
                  border: `1px solid ${venextTokens.color.primary}`,
                  padding: venextTokens.space.sm,
                  fontSize: 11,
                  color: venextTokens.color.primary,
                  textAlign: "center",
                }}
              >
                {nfcZone}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
