# VENEXT — Architecture summary (V1)

## Vue d’ensemble

VENEXT est une **infrastructure d’intelligence économique relationnelle** pour le commerce B2B fermé — quatre surfaces acteurs, packages foundation partagés, BFF commerce, core domain.

```
apps/
  mobile-grossiste-b, mobile-detaillant     → terrain
  web-grossiste-a, web-industrial-nextjs    → formel
packages/
  commerce-*, commercial-*, relational-*, venext-*
services/
  commerce-bff          → proxy + fallback + trim payloads
  core-domain-service   → persistence Prisma
```

## Principes architecture V1

1. **Monorepo packages** — logique métier en packages réutilisables, apps = shells + routing.
2. **BFF + fallback** — `venext_bff_routes_enabled`, enveloppes live/fallback/mixed.
3. **Feature flags** — activation progressive, seed Prisma aligné hooks frontend.
4. **Pas de temps réel** — refresh manuel, `POLLING_MS = 0`.
5. **Guards** — `commerce-foundation-guardrails`, `commerce-access-control`, wording anti-ERP.

## Flux données typique

1. App shell charge flags → hooks live data
2. Fetch BFF (`/api/notifications`, `/api/activity-feed`, …)
3. Si échec → fallback mock + cache local
4. Offline foundation : cache TTL, queue sync manuelle
5. Context routing : profondeur ≤ 2, retour rapide

## Packages foundation clés (instructions 20.74–20.86)

| Package | Rôle |
|---------|------|
| commerce-foundation-guardrails | Philosophie, wording, navigation |
| commercial-context-routing | Routing inter-modules |
| commerce-notifications | Notifications commerce |
| commercial-activity-feed | Timeline activité |
| commerce-offline-foundation | Cache / sync léger |
| commerce-access-control | Visibilité relationnelle |
| commerce-ux-harmony | Harmonisation UX |
| commerce-performance-foundation | Performance / cleanup |
| venext-v1-readiness | Audit final & gel V1 |

## Hors périmètre V1

Microservices multiples, websocket hub, data lake analytics, marketplace publique.
