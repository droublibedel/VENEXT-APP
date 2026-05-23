# Instruction 2 — design system foundation

This document mirrors the mandatory validation items for `@venext/design-system`.

## 1. Design token structure

- **Programmatic**: `packages/design-system/src/tokens/` — `colors.ts`, `typography.ts` (`DensityMode` scales), `space.ts` (spatial rhythm + elevation), `density.ts`, `index.ts` (`venextTokens`).
- **CSS variables**: `packages/design-system/tokens.css` — primary `#075E54`, secondary `#00A884`, accent `#FFC107`, industrial neutrals, Inter import, legacy `--vx-*` aliases for existing Tailwind consumers.
- **Tailwind**: `packages/design-system/tailwind-preset.cjs` — semantic `vx.*` colors, spacing, radii, shadows (`vxlayer`, `vxwallet`).

## 2. Motion system structure

- **TS contracts**: `src/motion/` — durations, easings, `motionRules` (allowed properties + banned marketing patterns).
- **CSS hooks**: `packages/design-system/motion.css` — CSS variables, `prefers-reduced-motion` collapse, `[data-vx-layer="float"]`, `[data-vx-pulse="live"]`.

## 3. Component hierarchy

- **Primitives**: `src/components/layer-surface.tsx`.
- **Commerce signals**: `src/commerce-signals/*`.
- **Wallet**: `src/wallet/*`.
- **Messaging**: `src/messaging/*`.
- **Maps**: `src/maps/*`.
- **Charts / intelligence**: `src/charts/*`.
- **Pole systems**: `src/pole-systems/*`.
- **Backoffice orchestration**: `src/backoffice/*`.
- **Barrel**: `src/index.ts` re-exports all public surfaces.

## 4. UX principles summary

- Economic OS: calm panels, deep graphite neutrals, signal greens, disciplined accent usage.
- Layered commerce: `LayerSurface`, map overlays, wallet scrim preserves underlying context.
- No ERP flatland: cards carry operational meaning; messaging is product-anchored.

## 5. Rendering optimization strategy

- `src/performance/rendering-rules.ts` — `resolvePerformanceProfile` toggles virtualization + progressive imagery based on `deviceMemoryGb`, `saveData`, and `prefers-reduced-motion`.
- Density profiles tie typography + virtualization thresholds to mobile vs industrial modes.

## 6. Map interaction architecture

- `src/maps/map-interaction-architecture.ts` documents overlay planes + selection binding.
- `OperationalMapPanel` reserves command chips, legend, realtime strip slots above map canvas.
- `GeoLegendControl` ships compact operational legend rows (GPU-light styling).

## 7. Messaging interaction architecture

- `src/messaging/messaging-interaction-architecture.ts` defines surfaces + transports.
- `ContextualMessagePanel` enforces pinned product + negotiation rail + structured events + thread + composer slots (commerce-native, not chat-clone chrome).

## 8. Wallet interaction architecture

- `wallet-interaction-architecture.ts` documents layer stack + gestures.
- `FloatingWalletLayer` implements scrim + slide-down sheet, QR + NFC slots, transactional z-index.

## 9. Pole specialization strategy

- `pole-specialization.ts` + `PoleCommandShell` — each pole supplies lexicon, overlay recipe, and composes unique command/map/telemetry regions via slots (no generic dashboard).

## 10. Backoffice orchestration strategy

- `OrchestrationShell` — command-center rails for feature activation, modules, AI provider, monitoring, emergency disable; visually distinct dark governance layer.

## Flutter parity (mobile)

Map `venextPalette` + `typographyScale` into `ThemeData` / `ColorScheme` on the Flutter side; keep commerce semantics (`relationalCatalogCopy`) aligned via `@venext/shared-i18n` for copy, not duplicated literals in widgets.
