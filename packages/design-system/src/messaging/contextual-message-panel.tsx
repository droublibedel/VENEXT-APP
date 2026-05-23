import type { HTMLAttributes, ReactNode } from "react";
import { venextTokens } from "../tokens";
import { NegotiationStateBar, type NegotiationPhase } from "../commerce-signals/negotiation-state-bar";

export interface ContextualMessagePanelProps
  extends HTMLAttributes<HTMLDivElement> {
  pinnedProduct: ReactNode;
  negotiationPhase?: NegotiationPhase;
  structuredEvents?: ReactNode;
  composer?: ReactNode;
  thread?: ReactNode;
}

/**
 * Commerce-native messaging — conversation orbits product + negotiation state.
 * Supports voice/image/video/text via slots (no WhatsApp chrome).
 */
export function ContextualMessagePanel({
  pinnedProduct,
  negotiationPhase = "draft",
  structuredEvents,
  composer,
  thread,
  style,
  ...rest
}: ContextualMessagePanelProps) {
  return (
    <div
      data-vx-message-panel
      style={{
        display: "grid",
        gridTemplateRows: "auto auto 1fr auto",
        gap: venextTokens.space.sm,
        height: "100%",
        minHeight: 360,
        padding: venextTokens.space.md,
        borderRadius: venextTokens.radius.lg,
        border: `1px solid ${venextTokens.color.neutral.line}`,
        background: venextTokens.color.neutral.white,
        fontFamily: venextTokens.font.sans,
        ...style,
      }}
      {...rest}
    >
      <div
        data-vx-pinned-product
        style={{
          borderRadius: venextTokens.radius.md,
          border: `1px solid ${venextTokens.color.neutral.lineStrong}`,
          padding: venextTokens.space.sm,
          background: venextTokens.color.neutral.panelWarm,
        }}
      >
        {pinnedProduct}
      </div>
      <NegotiationStateBar phase={negotiationPhase} />
      {structuredEvents ? (
        <div
          data-vx-structured-events
          style={{
            borderRadius: venextTokens.radius.md,
            border: `1px dashed ${venextTokens.color.neutral.lineStrong}`,
            padding: venextTokens.space.sm,
            fontSize: 12,
            color: venextTokens.color.neutral.graphiteMuted,
          }}
        >
          {structuredEvents}
        </div>
      ) : (
        <div />
      )}
      <div
        data-vx-thread
        style={{
          borderRadius: venextTokens.radius.md,
          background: venextTokens.color.neutral.panel,
          padding: venextTokens.space.sm,
          overflow: "auto",
        }}
      >
        {thread}
      </div>
      <div data-vx-composer>{composer}</div>
    </div>
  );
}
