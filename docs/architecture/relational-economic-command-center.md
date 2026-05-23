# Relational Economic Command Center (Instruction 20.20)

## Philosophy

Ce module est une **couche de pilotage stratégique systémique** pour les corridors commerciaux relationnels : agrégation de signaux déjà présents dans VENEXT (intelligence opérationnelle, prédiction, recommandations, orchestration « en cours de vie », simulations, revues critiques, mémoire stratégique et graphe de signaux).

Ce n’est **pas** :

- un tableau de bord ecommerce,
- un ERP / CRM,
- un graphe social,
- un outil de monitoring marketplace public,

et il n’embarque **aucune** IA générative ni pilotage automatique des opérations.

## Supervision systémique

Les scores exposés (**risque global**, **santé opérationnelle**, **chaleur de propagation**, pression clusters) sont **bornés**, **déterministes** et **reconstruisibles** à partir des comptages et agrégations Prisma + champs du graphe économique relationnel. Le centre ne modifie pas le commerce, le fulfillment, ni l’orchestration : il **observe**, **consolide** et **journalise** des instantanés immuables (snapshots append-only avec archivage explicite).

## Propagation & dépendances

La vue systémique s’appuie sur :

- la surface du graphe de signaux (**exposition systémique**, fragilités par corridor),
- les volumes incidents / tâches / alertes ouvertes,
- les artefacts critiques encore actifs en aval (orchestre non résolu, revues critiques, simulations critiques terminées).

Cela permet de cartographier des **zones de fragilité** et des motifs d’alerte dominants sans inférer au-delà des données métier disponibles.

## Chaîne d’ingestion

Après mise à jour du graphe économique relationnel (`syncGraphForRelationship`), le pipeline appelle **`refreshAfterSignalGraph`** : régénération d’un snapshot réseau / corridor conforme aux feature flags et à la **gouvernance corridor** (`assertCorridorOperational(..., operational_observation)` : lecture y compris sur corridors **TERMINATED** ; snapshots et archivages interdits sur **TERMINATED**).

## Temps réel

Les événements `relational.command.*` sont traités dans la gateway **avant** les `relational.economic.*`, avec **whitelist obligatoire** et schéma Zod strict : payloads minimaux (ids, scores, sévérité, timestamps) — aucun paiement, portefeuille, GPS ou tracking client.

## Limites V1

- Pas d’historisation graphique temps long hors snapshots / journal control events déjà prévus schéma.
- Pas de modèle prédictif externe : tous les agrégats restent intra-plateforme et explicables.
- Vue multi-organisation cantonnée aux corridors où l’organisation est partie prenante.

## Absence d’IA générative

Aucune synthèse LLM : tous les résultats proviennent de requêtes et règles codées inspectables dans `relational-economic-command-center` (core) et les contrats partagés.
