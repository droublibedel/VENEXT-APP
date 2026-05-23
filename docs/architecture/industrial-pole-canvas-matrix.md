# Industrial pole canvas matrix (Instruction 16A)

This document describes how operational map canvases are wired in `OperationalPoleCanvas` for industrial poles. It is descriptive only: no mandate to retrofit poles that intentionally use demo or static paths today.

## Legend

| Mode | Meaning |
|------|---------|
| **Bundle-driven canvas** | Geo `zones` / `routes` are built from the pole’s **bundle** API response via a pole-specific adapter. |
| **Demo-operational fallback** | When bundle data is unavailable or flags are off, the shell loads `/api/core/v1/poles/demo-operational/{poleSlug}` (static demo GeoJSON). |
| **No canvas adapter yet** | Operational canvas does not hydrate from a domain bundle; it relies on demo-operational (or empty layers when disabled) until an adapter exists. |

## Matrix (current behaviour)

| Pole slug | Canvas source | Notes |
|-----------|----------------|-------|
| `marketing-activation` | Bundle-driven + demo fallback | `buildMarketingActivationCanvasGeo` when `marketingActivationOrganizationId` + flag; else demo-operational. |
| `supply-logistics` | Bundle-driven + demo fallback | `buildSupplyLogisticsCanvasGeo` from `/supply-logistics/bundle`; `labeledDemoOperationalFallback` when not eligible. |
| `finance-collections` | Bundle-driven + demo fallback | `buildFinanceCollectionsCanvasGeo` from `/finance-collections/bundle`; `financeLabeledFallback` when not eligible. |
| `commercial-network` | Demo-operational / no bundle adapter | No marketing-style bundle canvas adapter in this shell path (Instruction 16A — unchanged). |
| `order-adv` | Demo-operational / no bundle adapter | Same as above — unchanged in 16A. |
| `strategic-intelligence` | Demo-operational / no bundle adapter | Same — unchanged in 16A. |
| Other industrial / shell poles | Typically demo-operational | Unless extended later with bundle hooks and flags similar to the three bundle-driven poles above. |

## Realtime vs canvas

Realtime WebSocket streams (`usePoleRealtimeGateway`) are orthogonal to canvas hydration: a pole may receive live frames while still using demo-operational geometry for the map.

## Related files

- `apps/web-industrial-nextjs/src/poles/shell/OperationalPoleCanvas.tsx`
- `apps/web-industrial-nextjs/src/poles/marketing-activation/marketing-activation-canvas-adapter.ts`
- `apps/web-industrial-nextjs/src/poles/supply-logistics/supply-logistics-canvas-adapter.ts`
- `apps/web-industrial-nextjs/src/poles/finance-collections/finance-collections-canvas-adapter.ts`
- `apps/web-industrial-nextjs/src/poles/demo/demo-operational-static.ts`
