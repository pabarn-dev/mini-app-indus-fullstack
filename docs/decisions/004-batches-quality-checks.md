# ADR 004 — Batches, Quality Checks & Quality Gate

- **Statut** : Accepté
- **Date** : 2026-06-16
- **Contexte** : Phase 5. Ajout des **lots de production** (Batch) et des **contrôles qualité**
  (QualityCheck) rattachés à un ProductionOrder, avec exigence de **traçabilité** (AuditLog) et
  d'une règle transversale bloquant la complétion d'un ordre en cas de contrôle `FAILED`. État du
  schéma : [docs/database.md](../database.md) (modèles existants depuis la Phase 2, **inchangés**).
  Décisions Production Orders : [ADR 003](003-production-orders-audit.md).

## Décisions

### D1 — Agrégats et modèle métier

- **ProductionOrder** = ordre à produire ; **Batch** = exécution réelle / lot ; **QualityCheck** =
  contrôle qualité d'un batch.
- `Batch` est **immuable** ; son état « terminé » est **dérivé de `completedAt`** (pas de colonne
  status). `recordQuantity` pose la **quantité totale produite** (set, pas un delta) et
  `complete` pose `completedAt` ; un lot terminé n'est plus modifiable.
- `QualityCheck` est **append-only** (créé une fois, jamais modifié), résultat
  `PASSED` / `WARNING` / `FAILED`. `checkedById = null` tant qu'il n'y a pas d'auth (Phase 6).

### D2 — Règles inter-agrégats dans les use cases

- Création d'un Batch **uniquement** si le ProductionOrder est `IN_PROGRESS`, vérifié via un read
  model `ProductionOrderGateway` (`{ id, status }`) — **aucun type Prisma ni entité** ne traverse.
- `sequence` attribuée **automatiquement** (`max(sequence) + 1`) par le use case. La contrainte
  `@@unique([productionOrderId, sequence])` protège la concurrence : la violation Prisma `P2002`
  est traduite en `DuplicateBatchSequenceError` (erreur **application**) par l'adapter.
- Ces règles vivent dans l'**application**, jamais dans le domaine (conforme ADR 003).

### D3 — Audit transactionnel

- `complete batch` → `STATUS_CHANGE` / `BATCH` / `metadata = { from: "OPEN", to: "COMPLETED" }`.
- `add quality check` → `CREATE` / `QUALITY_CHECK` / `metadata = { batchId, result }` (le contrôle
  est l'acte tracé, d'où un `CREATE`).
- **Pas d'audit** sur la création de Batch ni sur `recordQuantity`.
- Écriture entité **+** AuditLog dans **une seule transaction** (`TransactionRunner`) ;
  **rollback testé** en intégration pour `completeBatch` et `addQualityCheck`.

### D4 — Quality gate (point critique)

- Règle : un ProductionOrder `IN_PROGRESS` **ne peut pas être complété** si un de ses batches a au
  moins un QualityCheck `FAILED`.
- Vérifiée dans `CompleteProductionOrderUseCase`, **après** le `findById` et **avant** la
  transaction — un refus n'écrit donc **aucun audit `COMPLETED`**.
- Port `ProductionOrderQualityGate` (`hasFailedQualityCheck(orderId): boolean`) **possédé par
  ProductionOrders** ; l'adapter Prisma vit dans `production-orders/infrastructure` et lit
  `qualityCheck`/`batch` via une seule requête `count` **sans importer le module Batches**.
- **Limite connue (V1)** : le check est fait **hors transaction** (lecture préalable). Une course
  `FAILED ↔ complete` est hautement improbable à ce stade ; à revoir si besoin.

### D5 — Audit transversal & câblage des modules

- `AuditLogWriter` (+ `AuditAction`, `AuditEntityType`, `AuditEntry`) est désormais un **port
  partagé** (`shared/application/ports`) ; l'implémentation `PrismaAuditLogWriter` est déplacée en
  **infra partagée** (`src/infrastructure/prisma`). Aucune duplication entre modules.
- Câblage NestJS : `BatchesModule` importe `ProductionOrdersModule`, qui **exporte**
  `PRODUCTION_ORDER_REPOSITORY` (consommé par `ProductionOrderGatewayAdapter`). L'inverse est
  interdit → **pas de cycle de modules**.

## Conséquences

- Sens de dépendance unique : `Batches → ProductionOrders → Machines`.
- Le module ProductionOrders reste indépendant du module Batches, même pour le quality gate.
- Couverture de tests : **unitaires** (domaine + use cases), **intégration Prisma** (repositories,
  mappers, `DuplicateBatchSequenceError`, quality gate, rollback) et **e2e HTTP** (endpoints
  Batches + refus de complétion sur `FAILED`).
