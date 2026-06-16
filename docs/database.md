# Base de données

> **À maintenir :** ce document décrit l'état actuel du schéma. Toute migration
> importante doit être répercutée ici. Source de vérité = `apps/api/prisma/schema.prisma`
> et les migrations sous `apps/api/prisma/migrations/`.
>
> Le _pourquoi_ des choix de modélisation est dans
> [ADR 002 — Database modeling](decisions/002-database-modeling.md).
> Les versions de la stack sont dans [ADR 001](decisions/001-stack-versions.md).

## 1. Vue d'ensemble

- **PostgreSQL 17** (Docker, port hôte **5433**), **Prisma 7** (driver adapter `pg` au runtime).
- Migration initiale unique : `20260609074208_init`.
- 6 modèles : `User`, `Machine`, `ProductionOrder`, `Batch`, `QualityCheck`, `AuditLog`.

```
User ──< ProductionOrder >── Machine
            │
            └──< Batch ──< QualityCheck
User ──< QualityCheck (checkedBy)
User ──< AuditLog            AuditLog ··> (entityType, entityId)  // référence souple, sans FK
```

## 2. Modèles

### User

| Champ          | Type       | Null | Défaut       | Note                        |
| -------------- | ---------- | ---- | ------------ | --------------------------- |
| `id`           | String     | non  | `uuid(7)`    | PK                          |
| `email`        | String     | non  | —            | unique                      |
| `name`         | String     | non  | —            |                             |
| `role`         | `UserRole` | non  | `VIEWER`     |                             |
| `passwordHash` | String     | oui  | —            | `null` tant qu'auth absente |
| `createdAt`    | DateTime   | non  | `now()`      |                             |
| `updatedAt`    | DateTime   | non  | `@updatedAt` |                             |

### Machine

| Champ       | Type            | Null | Défaut       | Note                  |
| ----------- | --------------- | ---- | ------------ | --------------------- |
| `id`        | String          | non  | `uuid(7)`    | PK                    |
| `code`      | String          | non  | —            | unique (ex: `CNC-01`) |
| `name`      | String          | non  | —            |                       |
| `status`    | `MachineStatus` | non  | `ACTIVE`     |                       |
| `location`  | String          | oui  | —            |                       |
| `createdAt` | DateTime        | non  | `now()`      |                       |
| `updatedAt` | DateTime        | non  | `@updatedAt` |                       |

### ProductionOrder

| Champ            | Type                    | Null | Défaut       | Note                        |
| ---------------- | ----------------------- | ---- | ------------ | --------------------------- |
| `id`             | String                  | non  | `uuid(7)`    | PK                          |
| `reference`      | String                  | non  | —            | unique (ex: `PO-2026-0001`) |
| `status`         | `ProductionOrderStatus` | non  | `DRAFT`      |                             |
| `targetQuantity` | Int                     | non  | —            | quantité cible              |
| `machineId`      | String                  | non  | —            | FK → Machine                |
| `createdById`    | String                  | oui  | —            | FK → User                   |
| `plannedAt`      | DateTime                | oui  | —            | dates de cycle de vie       |
| `startedAt`      | DateTime                | oui  | —            |                             |
| `completedAt`    | DateTime                | oui  | —            |                             |
| `createdAt`      | DateTime                | non  | `now()`      |                             |
| `updatedAt`      | DateTime                | non  | `@updatedAt` |                             |

### Batch

| Champ               | Type     | Null | Défaut       | Note                    |
| ------------------- | -------- | ---- | ------------ | ----------------------- |
| `id`                | String   | non  | `uuid(7)`    | PK                      |
| `productionOrderId` | String   | non  | —            | FK → ProductionOrder    |
| `sequence`          | Int      | non  | —            | n° de lot dans l'ordre  |
| `quantityProduced`  | Int      | non  | `0`          |                         |
| `startedAt`         | DateTime | non  | `now()`      |                         |
| `completedAt`       | DateTime | oui  | —            | lot terminé si non-null |
| `createdAt`         | DateTime | non  | `now()`      |                         |
| `updatedAt`         | DateTime | non  | `@updatedAt` |                         |

### QualityCheck

| Champ         | Type                 | Null | Défaut    | Note                         |
| ------------- | -------------------- | ---- | --------- | ---------------------------- |
| `id`          | String               | non  | `uuid(7)` | PK                           |
| `batchId`     | String               | non  | —         | FK → Batch                   |
| `result`      | `QualityCheckResult` | non  | —         |                              |
| `notes`       | String               | oui  | —         |                              |
| `checkedById` | String               | oui  | —         | FK → User                    |
| `createdAt`   | DateTime             | non  | `now()`   | immuable (pas d'`updatedAt`) |

### AuditLog

| Champ        | Type              | Null | Défaut    | Note                            |
| ------------ | ----------------- | ---- | --------- | ------------------------------- |
| `id`         | String            | non  | `uuid(7)` | PK                              |
| `action`     | `AuditAction`     | non  | —         |                                 |
| `entityType` | `AuditEntityType` | non  | —         |                                 |
| `entityId`   | String            | non  | —         | référence souple (sans FK)      |
| `userId`     | String            | oui  | —         | FK → User                       |
| `metadata`   | Json              | oui  | —         | jsonb, ex: `{ "from", "to" }`   |
| `createdAt`  | DateTime          | non  | `now()`   | append-only (pas d'`updatedAt`) |

### Enums

- `UserRole` : `ADMIN`, `OPERATOR`, `VIEWER`
- `MachineStatus` : `ACTIVE`, `MAINTENANCE`, `DISABLED`
- `ProductionOrderStatus` : `DRAFT`, `PLANNED`, `IN_PROGRESS`, `COMPLETED`, `CANCELLED`
- `QualityCheckResult` : `PASSED`, `WARNING`, `FAILED`
- `AuditAction` : `CREATE`, `UPDATE`, `DELETE`, `STATUS_CHANGE`
- `AuditEntityType` : `USER`, `MACHINE`, `PRODUCTION_ORDER`, `BATCH`, `QUALITY_CHECK`

## 3. Relations

| Relation                  | Cardinalité | onDelete | Note                    |
| ------------------------- | ----------- | -------- | ----------------------- |
| Machine → ProductionOrder | 1—N         | Restrict | via `machineId`         |
| User → ProductionOrder    | 1—N         | SetNull  | `OrderCreatedBy`        |
| ProductionOrder → Batch   | 1—N         | Restrict | via `productionOrderId` |
| Batch → QualityCheck      | 1—N         | Restrict | via `batchId`           |
| User → QualityCheck       | 1—N         | SetNull  | `CheckPerformedBy`      |
| User → AuditLog           | 1—N         | SetNull  |                         |

`User` porte **3 relations nommées** distinctes (`OrderCreatedBy`, `CheckPerformedBy`, `auditLogs`).

## 4. Contraintes

- **Uniques :** `User.email`, `Machine.code`, `ProductionOrder.reference`,
  `Batch(productionOrderId, sequence)`.
- **Nullable assumés** (le métier le justifie) : `passwordHash`, `createdById`,
  `plannedAt`/`startedAt`/`completedAt`, `location`, `notes`, `userId` (AuditLog).
- Tout le reste est `NOT NULL`.

## 5. Index

| Modèle          | Index                                           | Finalité                      |
| --------------- | ----------------------------------------------- | ----------------------------- |
| User            | `role`                                          | filtrage par rôle             |
| Machine         | `status`                                        | filtrage machines actives     |
| ProductionOrder | `status`, `machineId`, `createdById`            | filtres / FK                  |
| Batch           | `productionOrderId`                             | lots d'un ordre               |
| QualityCheck    | `batchId`, `result`                             | contrôles d'un lot / résultat |
| AuditLog        | `(entityType, entityId)`, `userId`, `createdAt` | recherche d'audit             |

Les contraintes `@unique` créent déjà leur index.

## 6. Stratégie AuditLog

- Journal **polymorphe** : `entityType` + `entityId` ciblent n'importe quelle entité,
  **sans clé étrangère** sur `entityId` (un seul journal pour tous les modèles).
- `metadata` (jsonb) porte le contexte, ex. pour un `STATUS_CHANGE` :
  `{ "from": "DRAFT", "to": "PLANNED" }`.
- **Append-only** (`createdAt` seul), `userId` en `SetNull` (le journal survit à la
  suppression d'un utilisateur).
- La cohérence (entityId valide, action correcte) est garantie par les **use cases**
  applicatifs (Phases 4 et 5), pas par la base.
- Entités tracées : `PRODUCTION_ORDER` (`STATUS_CHANGE` sur transitions), `BATCH`
  (`STATUS_CHANGE` à la complétion d'un lot) et `QUALITY_CHECK` (`CREATE` à l'ajout d'un contrôle).
- **Aucun changement de schéma en Phase 5** : les modèles `Batch` et `QualityCheck` existent
  depuis la Phase 2 ; la Phase 5 n'a ajouté que du code applicatif.

## 7. Stratégie de suppression (Restrict / SetNull)

- **Chaîne de production = `Restrict`** : `Machine → ProductionOrder → Batch → QualityCheck`.
  Supprimer un parent ayant des enfants est **refusé par la base** → l'historique est protégé.
- **Références utilisateur = `SetNull`** : si un `User` est supprimé, ses liens
  (`createdBy`, `checkedBy`, `AuditLog.user`) passent à `null` sans détruire la donnée métier.
- **Principe** : en pratique on **annule** (`CANCELLED`), on ne supprime pas.

## 8. Seed minimal

Données de développement créées **idempotemment** (`upsert` sur clés uniques) par
`pnpm --filter api db:seed` :

| Entité          | Données                                                    |
| --------------- | ---------------------------------------------------------- |
| User            | `admin@ipp.local` (ADMIN), `operator@ipp.local` (OPERATOR) |
| Machine         | `CNC-01` (ACTIVE), `CNC-02` (MAINTENANCE)                  |
| ProductionOrder | `PO-2026-0001` (DRAFT, 100), `PO-2026-0002` (PLANNED, 250) |

Relancer le seed ne crée pas de doublon. Comptes de dev et stratégie d'auth future :
voir [docs/dev-access.md](dev-access.md). Aucun mot de passe n'est stocké (auth en Phase 6).

## 9. Points de vigilance

- **Enums Postgres** : ajouter une valeur est simple ; renommer/supprimer impose une
  migration plus lourde → valeurs figées dès maintenant.
- **`metadata` jsonb** : non validé par la base → validation côté domaine.
- **`AuditLog.entityId` sans FK** : pas d'intégrité référentielle (orphelins possibles,
  choix assumé pour le côté générique).
- **Migrations immuables** : toute évolution = **nouvelle** migration (jamais d'édition
  d'une migration appliquée).
- **Quantités en `Int`** : passage à `Decimal` possible plus tard si des fractions
  deviennent nécessaires.

## 10. Références

- [ADR 001 — Stack & versions](decisions/001-stack-versions.md)
- [ADR 002 — Database modeling](decisions/002-database-modeling.md)
- [ADR 003 — Production Orders : transitions, audit transactionnel & MachineGateway](decisions/003-production-orders-audit.md)
- [docs/dev-access.md](dev-access.md)
