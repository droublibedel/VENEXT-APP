# Instruction 20.81 — Activity Feed Commerce-First

## Livrable

Feed d'activité commerciale relationnelle (réseau fermé), sans logique sociale.

**Aucun commit git** sur cette instruction.

## Package `packages/commercial-activity-feed/`

| Fichier | Rôle |
|---------|------|
| `commercial-activity-feed.types.ts` | Types, filtres, timeline, flags |
| `commercial-activity-feed-events.ts` | 15 événements + démo par acteur |
| `commercial-activity-feed-governance.ts` | Visibilité relationnelle (CRG) |
| `commercial-activity-feed-intelligence.ts` | Labels, anti-social, anti-ERP |
| `commercial-activity-feed-i18n.ts` | FR / EN / AR / ZH |
| `commercial-activity-feed-grouping.ts` | `buildActivityGroups()` |
| `commercial-activity-feed-timeline.ts` | `buildActivityTimeline()`, `buildActivitySummary()` |
| `commercial-activity-feed-storage.ts` | BFF + cache local, pas de polling |
| `commercial-activity-feed-center.ts` | `openActivityContext()` |
| `useCommercialActivityFeed.ts` | Hook refresh manuel |
| `commercial-activity-feed.spec.ts` | 45+ tests |
| UI | Feed, Card, Timeline, Group, Empty, Mobile, Filters, Shell |
| `styles/commercial-activity-feed.css` | Styles sobres |

## Événements (15)

`ORDER_CREATED`, `ORDER_CONFIRMED`, `ORDER_COMPLETED`, `DELIVERY_STARTED`, `DELIVERY_CONFIRMED`, `SETTLEMENT_RECEIVED`, `RELATION_ESTABLISHED`, `NEW_RELATIONAL_CATALOG`, `SPONSORED_PRODUCT_VISIBLE`, `PARTNER_ACTIVITY`, `NETWORK_ACTIVITY`, `MAIL_SENT`, `MESSAGE_ACTIVITY`, `WALLET_ACTIVATED`, `WALLET_SECURED`.

## Backend / BFF

- Core : `CommerceActivityFeed` + `CommerceActivityFeedPersistenceService`
- Routes core : `GET /commerce-foundation/activity-feed`, `.../summary`, `PATCH .../:id/read`
- BFF : `GET /api/activity-feed`, `GET /api/activity-feed/summary`, `PATCH /api/activity-feed/:id/read`
- Pas de websocket ; `COMMERCIAL_ACTIVITY_FEED_POLLING_MS = 0`

## Feature flags

- `commercial_activity_feed_enabled`
- `commercial_activity_timeline_enabled`
- `commercial_activity_grouping_enabled`

DEV : true — PROD : false (hooks apps + seed Prisma).

## Apps

- `GrossisteBActivityFeedBridge` → `GrossisteActivityScreen`
- `DetaillantActivityFeedBridge` → `DetaillantHomeScreen`
- `GrossisteAActivityFeedBridge` → `GrossisteAOverviewWorkspace`
- `ProducerActivityFeedBridge` → `ProducerExecutiveDashboard`

## Limitations

- Persistance demo vide côté core jusqu'à seed dédié (fallback package actif).
- Pas de `PATCH /api/activity-feed/read` global (lecture par id uniquement).
- Résumé BFF minimal si core indisponible.

## Confirmation philosophie VENEXT

- Commerce-first, relationnel fermé, gouverné
- Pas de likes / commentaires / viral / trending public
- Timeline légère (30 j max, aujourd'hui / hier / semaine)
- Refresh manuel uniquement
