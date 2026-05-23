# Commerce foundation — setup local (Instruction 20.79-A)

Setup léger pour la persistance démo VENEXT (pas de Docker obligatoire).

## Prérequis

- Node.js ≥ 20
- PostgreSQL local avec `DATABASE_URL` dans `.env`

Exemple `.env` :

```env
DATABASE_URL="postgresql://postgres:postgres@127.0.0.1:5432/venext?schema=public"
```

## Bootstrap rapide

```bash
npm run commerce:bootstrap
```

Équivalent à : `db:generate` → `db:push` → `commerce:seed`.

## Scripts

| Script | Action |
|--------|--------|
| `npm run commerce:seed` | Insère la démo si vide |
| `npm run commerce:reset` | Soft-delete des enregistrements fondation |
| `npm run commerce:bootstrap` | Generate + push + seed |

## Migration

```bash
npm run db:migrate:dev
# ou
npm run db:push
```

Migration dédiée : `prisma/migrations/20260519120000_instruction_20_79_commerce_foundation/`.

## Services

```bash
# Core domain (port 3200)
cd services/core-domain-service && npm run dev

# Commerce BFF (port 3210)
cd services/commerce-bff && npm run dev
```

## Apps frontend

Proxy Vite `/api` → `http://127.0.0.1:3210` (mobile grossiste B, détaillant, web grossiste A, industrial).

Flags DEV : `venext_bff_routes_enabled`, `venext_live_data_fallback_enabled`.

## Vérification

```bash
curl http://127.0.0.1:3210/api/health
curl "http://127.0.0.1:3210/api/producer/catalog?organizationId=org-producer-agronexus-ci"
curl "http://127.0.0.1:3210/api/grossiste-a/orders?organizationId=org-grossiste-a-nord-plus"
```

## Limitations

- Démo uniquement — pas de banque / mobile money réel
- Pas de marketplace globale
- Historique contexte commercial limité à 5 entrées
