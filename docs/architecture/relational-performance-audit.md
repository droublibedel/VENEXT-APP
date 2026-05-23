# Relational Performance Audit (Instruction 20.44)

## Hydration fulfillment (avant / après)

| Métrique | Avant 20.44 | Après 20.44 |
|----------|-------------|-------------|
| Panneaux montés au load | ~37 | ~6 (cœur) + 0 contenu sections repliées |
| Listeners realtime | Tous panels actifs si gateway passé | Idem si section ouverte |
| Scroll height | Très long | Réduit (sections fermées) |

## Lazy loading

- `PoleEntryClient` : `dynamic()` par pôle (déjà en place).
- Sections stratégiques : enfants non rendus si `open === false`.

## Route weight

- 80 routes SSG pôles (+1 macro-observatory-governance).
- BFF proxies par couche : chargés à la demande via fetch panel.

## Panel expansion cost

Ouvrir une section = montage synchrone de 3–9 panels embedded → coût acceptable à la demande.

## Recommandations

- Mesurer LCP fulfillment en prod avec sections fermées.
- Ne pas activer toutes flags realtime sur mobile terrain.
