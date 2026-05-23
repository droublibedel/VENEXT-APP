import type { HTMLAttributes, ReactNode } from "react";
import { relationalCatalogCopy } from "../vernacular/relational-catalog";
import { venextTokens } from "../tokens";
import { SignalCard } from "./signal-card";

export interface ProductNodeSignals {
  activity?: string;
  stockTension?: string;
  discussions?: string;
  demand?: string;
  sponsor?: string;
  credibility?: string;
  network?: string;
  negotiation?: string;
}

export interface ProductNodeCardProps extends HTMLAttributes<HTMLDivElement> {
  title: string;
  supplierName: string;
  sku?: string;
  signals?: ProductNodeSignals;
  media?: ReactNode;
}

/**
 * Product as economic signal hub — not a passive SKU tile.
 * Supplier context is always visible (relationship-native catalog).
 */
export function ProductNodeCard({
  title,
  supplierName,
  sku,
  signals,
  media,
  style,
  ...rest
}: ProductNodeCardProps) {
  return (
    <div
      data-vx-product-node
      style={{
        display: "grid",
        gap: venextTokens.space.sm,
        padding: venextTokens.space.md,
        borderRadius: venextTokens.radius.lg,
        border: `1px solid ${venextTokens.color.neutral.line}`,
        background: venextTokens.color.neutral.white,
        fontFamily: venextTokens.font.sans,
        ...style,
      }}
      {...rest}
    >
      <div style={{ display: "flex", gap: venextTokens.space.sm }}>
        <div
          style={{
            width: 72,
            height: 72,
            borderRadius: venextTokens.radius.md,
            background: venextTokens.color.neutral.panel,
            border: `1px dashed ${venextTokens.color.neutral.lineStrong}`,
            display: "grid",
            placeItems: "center",
            fontSize: 11,
            color: venextTokens.color.neutral.graphiteMuted,
          }}
        >
          {media ?? "IMG"}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: 11,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              color: venextTokens.color.primary,
            }}
          >
            {relationalCatalogCopy.supplierContext}: {supplierName}
          </div>
          <div
            style={{
              marginTop: 4,
              fontSize: 16,
              fontWeight: 600,
              color: venextTokens.color.neutral.graphite,
            }}
          >
            {title}
          </div>
          {sku ? (
            <div style={{ marginTop: 2, fontSize: 12, color: "#475569" }}>
              {sku}
            </div>
          ) : null}
        </div>
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit,minmax(120px,1fr))",
          gap: venextTokens.space.xs,
        }}
      >
        {signals?.activity ? (
          <SignalCard label="Activity" value={signals.activity} tone="live" />
        ) : null}
        {signals?.stockTension ? (
          <SignalCard
            label="Stock tension"
            value={signals.stockTension}
            tone="tension"
          />
        ) : null}
        {signals?.discussions ? (
          <SignalCard label="Discussions" value={signals.discussions} />
        ) : null}
        {signals?.demand ? (
          <SignalCard label="Demand" value={signals.demand} tone="live" />
        ) : null}
        {signals?.sponsor ? (
          <SignalCard
            label="Sponsor visibility"
            value={signals.sponsor}
            tone="sponsor"
          />
        ) : null}
        {signals?.credibility ? (
          <SignalCard label="Credibility" value={signals.credibility} />
        ) : null}
        {signals?.network ? (
          <SignalCard label="Network" value={signals.network} />
        ) : null}
        {signals?.negotiation ? (
          <SignalCard
            label="Negotiation"
            value={signals.negotiation}
            tone="tension"
          />
        ) : null}
      </div>
    </div>
  );
}
