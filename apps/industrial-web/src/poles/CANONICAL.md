# Instruction 5 §12 — pole source layout

Canonical implementation (routes `/poles`, `/poles/[pole]`, shared shell, MapControlEngine, hooks, services):

`apps/web-industrial-nextjs/src/poles/`

Per-pole trees (layout via `PoleWorkspace.tsx`, widgets, overlays, hooks, services, `ai-context.ts`, `map-controls.ts`):

| Pole | Path |
|------|------|
| DIRECTION_STRATEGY | `direction-strategy/` |
| COMMERCIAL_NETWORK | `commercial-network/` |
| MARKETING_ACTIVATION | `marketing-activation/` |
| ORDERS_ADV | `orders-adv/` |
| SUPPLY_LOGISTICS | `supply-logistics/` |
| FINANCE_COLLECTIONS | `finance-collections/` |
| DATA_INTELLIGENCE | `data-intelligence/` |
| INDUSTRIAL_SAFETY | `industrial-safety/` |

Backend submodule manifests: `services/core-domain-service/src/modules/poles/submodules/`.

Do not duplicate these folders under `industrial-web`; this file is the path contract anchor only.
