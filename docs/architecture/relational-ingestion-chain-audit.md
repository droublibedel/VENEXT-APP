# Relational Ingestion Chain Audit (Instruction 20.44)

## Chaîne 20.28 → 20.43

Chaque ingestion :

1. `ingestActive.has(relationshipId)` → return (anti-loop)
2. `ingestActive.add`
3. `try { sync state, persist, realtime }`
4. `finally { await nextLayer.sync(...); ingestActive.delete }`

Terminal : **20.43** — `finally` ne chaîne plus, seulement `ingestActive.delete`.

## Risques

| Risque | Mitigation actuelle |
|--------|---------------------|
| Boucle ingestion | `Set` par service |
| Double fan-out realtime | Flags + publish conditionnel sur détections |
| Profondeur 16 appels sync | Accepté démo ; registre pour observabilité |
| forwardRef cycles | Uniquement module N → N+1 |

## forwardRef

16/16 chaînes niveau 5 utilisent `forwardRef` sauf `institutional-reporting` → `strategic-intelligence` (inject direct).

## try/catch dupliqués

Pattern identique : log JSON + `ingestActive.delete` en finally. Pas factorisé (évite abstraction prématurée).

## Recommandations post-20.44

- Ne pas ajouter de couche 20.44+ analytique sans revue registre.
- Envisager ingestion orchestrator unique en phase produit terrain (20.45+) si latence mesurée.
