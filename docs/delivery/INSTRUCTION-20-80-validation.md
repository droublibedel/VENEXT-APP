# Instruction 20.80 — Notifications & centre d’événements commerce-first

## Statut

Fondation livrée. **Aucun commit git.**

## Package `packages/commerce-notifications/`

- Types, événements (17), gouvernance par acteur, priorités, intelligence (labels/hints/actions), storage BFF/fallback, centre, hook `useCommerceNotifications`
- UI : bell, center, card, list, empty, mobile sheet, preferences
- `CommerceNotificationsShell` — intégration clé en main

## BFF / persistance

- `GET/PATCH /api/notifications*`
- Core : `CommerceNotificationPersistenceService` + routes `/v1/commerce-foundation/notifications`

## Feature flags

- `commerce_notifications_enabled`
- `commerce_notification_preferences_enabled`
- `commerce_notification_context_routing_enabled`

## Intégrations

- mobile-grossiste-b, mobile-detaillant, web-grossiste-a, web-industrial-nextjs (producteur)

## Confirmations

- Commerce-first, pas social / feed public
- Pas de websocket, pas de polling (`COMMERCE_NOTIFICATIONS_POLLING_MS = 0`)
- URGENT rare (wallet, règlement, livraison proche)
- Liens contextuels via `commercial-context-routing`
- i18n fr / en / ar / zh
