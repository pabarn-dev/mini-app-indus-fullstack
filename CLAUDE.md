# CLAUDE.md

Contexte projet pour les sessions Claude. Réponses courtes et factuelles.

**Industrial Production Pilot** — application industrielle V1, monorepo Fullstack TypeScript,
architecture hexagonale. Domaine : machines, ordres de production, lots, contrôles qualité, audit.

## 1. État du projet

- Phase 1 (init monorepo) — **terminée**
- Phase 2 (base de données Prisma) — **terminée**
- Phase 3 (module Machines) — **terminée**
- Phase 4 (module Production Orders) — **terminée** (4B→4F : domaine, use cases, infra Prisma +
  audit transactionnel, presentation, tests unit + intégration + e2e)
- Phase 5 (Batches & Quality Checks) — **terminée** (5B→5F : domaine, use cases, infra Prisma +
  audit transactionnel, quality gate, presentation, tests unit + intégration + e2e)
- **Prochaine étape : Phase 6 — Auth / rôles / sécurité API**

## 2. Stack actuelle

Node.js 24 LTS · pnpm (Corepack) · TypeScript 5.9 strict · NestJS 11 · Prisma 7 (+ driver
adapter `pg`) · PostgreSQL 17 (Docker, **port hôte 5433**) · Next.js 16 · React 19.2 ·
Mantine 9 · Vitest (unit + intégration) · Docker Compose.
Détails versions : `docs/decisions/001-stack-versions.md`.

## 3. Architecture backend (hexagonale)

```
apps/api/src/
  modules/<feature>/
    domain/          entités, value objects, erreurs (pur)
    application/     use cases + ports (interfaces + tokens DI)
    infrastructure/  Prisma : repositories, mappers, adapters
    presentation/    controllers, DTO, response mappers, filtres
    <feature>.module.ts
  infrastructure/    PrismaService, UuidV7Generator, SystemClock, PrismaTransactionRunner
  shared/            domain/errors, application/ports
```

- **domain** : ne dépend pas de NestJS / Prisma / HTTP.
- **application** : orchestre via ports ; use cases **sans décorateur Nest** (DI via `useFactory`).
- **infrastructure** : seul endroit avec Prisma ; mapper Prisma ↔ domaine obligatoire.
- **presentation** : controllers **fins** + DTO (`class-validator`) + mapping erreurs (`DomainExceptionFilter`).
- **Aucun type Prisma dans domain / application / presentation.**

## 4. Modules existants

**Machines — terminé.** Domaine, use cases, infra Prisma, endpoints HTTP
(`GET/POST /machines`, `GET /machines/:id`, `PATCH /machines/:id/status`), tests unit +
intégration + e2e. `MachineRepository` **exporté** (token `MACHINE_REPOSITORY`) pour usage par
Production Orders via `MachineGateway`.

**Production Orders — terminé.**

- Domaine : statuts `DRAFT → PLANNED → IN_PROGRESS → COMPLETED` / `CANCELLED`,
  transitions immuables `plan/start/complete/cancel`, transitions invalides refusées.
- Use cases (Create/List/GetById/Plan/Start/Complete/Cancel).
- Infra Prisma (repository, mapper, `MachineGatewayAdapter`, `PrismaAuditLogWriter`).
- **AuditLog transactionnel** (update + audit dans une seule transaction ; rollback testé).
- Presentation : endpoints `GET/POST /production-orders`, `GET /:id`,
  `POST /:id/{plan|start|complete|cancel}` ; tests unit + intégration + **e2e**.
- **Complétion bloquée si un batch a un QualityCheck `FAILED`** (port `ProductionOrderQualityGate`).

**Batches & Quality Checks — terminé.**

- Modèle : **ProductionOrder** = ordre à produire ; **Batch** = exécution réelle / lot ;
  **QualityCheck** = contrôle qualité d'un batch.
- Domaine : `Batch` immuable, état dérivé de `completedAt` (pas de colonne status) ;
  `QualityCheck` **append-only** (`PASSED` / `WARNING` / `FAILED`).
- Règles (use cases) : Batch créé **uniquement** sur un ProductionOrder `IN_PROGRESS` ;
  `sequence` **auto** (`max+1`) ; `recordQuantity` = **quantité totale produite** (set, pas un
  delta) ; batch terminé **non modifiable** ; ordre **non complétable** si un de ses batches a un
  QualityCheck `FAILED`.
- Endpoints : `POST /batches`, `GET /batches?productionOrderId=…`, `GET /batches/:id`,
  `PATCH /batches/:id/quantity`, `POST /batches/:id/complete`,
  `POST /batches/:id/quality-checks`, `GET /batches/:id/quality-checks`.
- Audit transactionnel : `complete batch → STATUS_CHANGE / BATCH` (`{ from: "OPEN", to: "COMPLETED" }`),
  `add quality check → CREATE / QUALITY_CHECK` ; refus de complétion sur `FAILED` → **aucun audit**.
- Infra Prisma (mappers, repositories, `ProductionOrderGatewayAdapter`) ; tests unit, intégration,
  **e2e** et rollback.

## 5. Shared important

- `src/shared/domain/errors/` : `DomainError` (base) → `NotFoundDomainError` (404),
  `ConflictDomainError` (409), `ValidationDomainError` (400). Le `DomainExceptionFilter`
  mappe via ces bases sémantiques.
- `src/shared/application/ports/` : `IdGenerator`, `Clock`, `TransactionRunner`,
  **`AuditLogWriter`** (port transversal) (+ tokens).
- `src/infrastructure/prisma/` : `PrismaAuditLogWriter` (impl partagée du port d'audit).

## 6. Décisions importantes

- `IdGenerator` et `Clock` sont **partagés** (pas propres à Machines).
- `TransactionRunner` = Prisma `$transaction` + **AsyncLocalStorage** ; repos/audit utilisent
  `prisma.db` (client de transaction courant sinon client de base).
- **ProductionOrder update + AuditLog = une seule transaction** (atomicité ; **rollback testé**
  en intégration).
- `MachineGateway` expose **seulement un read model minimal** `{ id, status, isUsable }`
  (pas de Prisma, pas d'entité Machine).
- AuditLog écrit **uniquement sur les transitions de statut**, pas à la création (sauf
  QualityCheck : `CREATE` à l'ajout, car le contrôle est l'acte tracé).
- `AuditLogWriter` est un **port partagé** ; `PrismaAuditLogWriter` vit en **infra partagée**.
- **Quality gate côté ProductionOrders** : `BatchesModule` importe `ProductionOrdersModule` (qui
  exporte `PRODUCTION_ORDER_REPOSITORY`) ; l'inverse est interdit → **pas de cycle**. L'adapter du
  gate lit `qualityCheck`/`batch` via Prisma sans importer le module Batches.
- Le check `FAILED` est fait **hors transaction** (lecture préalable) — limite connue V1.
- `userId = null` tant qu'il n'y a pas d'auth (Phase 6).
- **Pas de migration ni reset DB sans validation explicite.**
- Détails Production Orders / audit : `docs/decisions/003-production-orders-audit.md`.
- Détails Batches / quality checks / quality gate : `docs/decisions/004-batches-quality-checks.md`.

## 7. Tests et commandes utiles

```bash
pnpm --filter api test                 # unitaires (sans DB)
pnpm --filter api test:integration     # repo + e2e + rollback (DB 5433 requise)
pnpm --filter api build
pnpm lint
pnpm format:check
docker compose ps                      # PostgreSQL healthy 5433
```

## 8. Règles de travail avec Claude

- Toujours **proposer un plan avant de coder**.
- Ne pas modifier trop de fichiers sans validation.
- Réponses **courtes et factuelles**.
- Pas de `any` ; TypeScript strict.
- Pas d'UI tant que le backend n'est pas stable.
- Ne pas modifier `schema.prisma` sans justification **et** validation.
- Ne pas lancer de migration ni reset DB sans validation.
- Indiquer clairement : fichiers modifiés, tests ajoutés, commandes exécutées, résultats.

## 9. Documents à lire avant toute modification

- `CLAUDE.md`
- `README.md`
- `docs/roadmap.md`
- `docs/database.md`
- `docs/dev-access.md`
- `docs/decisions/001-stack-versions.md`
- `docs/decisions/002-database-modeling.md`
- `docs/decisions/003-production-orders-audit.md`
- `docs/decisions/004-batches-quality-checks.md`
- `apps/api/prisma/schema.prisma`
