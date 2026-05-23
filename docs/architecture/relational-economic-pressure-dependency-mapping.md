# Relational Economic Pressure & Dependency Mapping (Instruction 20.21)

## Philosophie

Cette couche prolonge la chaîne **mémoire stratégique → graphe économique → centre de commande** en matérialisant une **carte déterministe des dépendances inter-corridors** et des **pressions systémiques** (saturation coordination, incidents, orchestrations, propagation, densité de dépendances). Elle sert l’**intelligence économique corridor** africaine réelle : concentrations dangereuses, asymétries, fragilité structurelle — sans prétendre remplacer un ERP logistique ou un suivi colis.

## Différence avec un ERP / dashboard logistique

- Pas de géolocalisation, pas de tracking acheteur, pas de wallet ni de flux financiers.
- Pas de notation partenaire publique ni de monitoring marketplace.
- Les sorties sont **bornées**, **reproductibles** et **auditables** (journal `relational_economic_pressure_events`, arêtes versionnées par archivage).

## Propagation & pression

Les scores (saturation, coordination, incidents, orchestration, propagation, dépendance, systémique) agrègent des comptages et champs déjà présents dans VENEXT (fulfillment, orchestration, incidents, tâches, prédiction, recommandations, mémoire stratégique, nœuds graphe 20.19). La **contagion** est projetée via un **BFS borné** sur le graphe de pression (`VENEXT_ECONOMIC_PRESSURE_MAX_DEPTH`).

## Cartographie des dépendances

Chaque corridor actif peut posséder un **nœud de pression** (`relational_economic_dependency_nodes`). Les **arêtes** (`relational_economic_dependency_edges`) relient le corridor focal aux corridors pairs partageant des organisations économiques (détection via commandes). Le type d’arête côté Prisma utilise l’enum `RelationalEconomicPressureDependencyLinkType` (distinct de `RelationalEconomicDependencyType` du graphe signal 20.19, déjà réservé).

## Gouvernance

- Lecture : `assertCorridorOperational(..., "operational_observation")` — historique **TERMINATED** autorisé.
- Écriture (sync graphe, création arêtes, archivage) : **interdite** sur **TERMINATED** via `canMutateEconomicPressureGraph()`.

## Temps réel

Événements `relational.pressure.*` validés en gateway **avant** `relational.command.*` et `relational.economic.*`, schéma Zod strict, sans champs GPS/paiement/wallet.

## Limites V1

- Détection de pairs limitée aux corrélations « même organisation sur commandes » (pas de graphe social externe).
- Pas de modèle génératif : aucune synthèse LLM.
- Profondeur de contagion plafonnée par variable d’environnement.
