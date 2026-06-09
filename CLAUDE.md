# CLAUDE.md

Contexte projet pour les sessions Claude. Réponses courtes et factuelles.

**Industrial Production Pilot** — application industrielle V1, monorepo Fullstack TypeScript,
architecture hexagonale. Domaine : machines, ordres de production, lots, contrôles qualité, audit.

## 1. État du projet

- Phase 1 (init monorepo) — **terminée**
- Phase 2 (base de données Prisma) — **terminée**
- Phase 3 (module Machines) — **terminée**
- Phase 4 (module Production Orders) — **en cours**
  - Lots **4B (domaine)**, **4C (use cases + ports)**, **4D (infra Prisma + audit transactionnel)** terminés
  - **Prochaine étape : Lot 4E — Presentation Production Orders**

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

**Production Orders — en cours.**

- Domaine terminé : statuts `DRAFT → PLANNED → IN_PROGRESS → COMPLETED` / `CANCELLED`,
  transitions immuables `plan/start/complete/cancel`, transitions invalides refusées.
- Use cases terminés (Create/List/GetById/Plan/Start/Complete/Cancel).
- Infra Prisma terminée (repository, mapper, `MachineGatewayAdapter`, `PrismaAuditLogWriter`).
- **AuditLog transactionnel terminé** (update + audit dans une seule transaction).
- **Presentation pas encore faite** (Lot 4E).

## 5. Shared important

- `src/shared/domain/errors/` : `DomainError` (base) → `NotFoundDomainError` (404),
  `ConflictDomainError` (409), `ValidationDomainError` (400). Le `DomainExceptionFilter`
  mappe via ces bases sémantiques.
- `src/shared/application/ports/` : `IdGenerator`, `Clock`, `TransactionRunner` (+ tokens).

## 6. Décisions importantes

- `IdGenerator` et `Clock` sont **partagés** (pas propres à Machines).
- `TransactionRunner` = Prisma `$transaction` + **AsyncLocalStorage** ; repos/audit utilisent
  `prisma.db` (client de transaction courant sinon client de base).
- **ProductionOrder update + AuditLog = une seule transaction** (atomicité ; **rollback testé**
  en intégration).
- `MachineGateway` expose **seulement un read model minimal** `{ id, status, isUsable }`
  (pas de Prisma, pas d'entité Machine).
- AuditLog écrit **uniquement sur les transitions de statut**, pas à la création.
- `userId = null` tant qu'il n'y a pas d'auth (Phase 6).
- **Pas de migration ni reset DB sans validation explicite.**
- Détails Production Orders / audit : `docs/decisions/003-production-orders-audit.md`.

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
- `docs/database.md`
- `docs/dev-access.md`
- `docs/decisions/001-stack-versions.md`
- `docs/decisions/002-database-modeling.md`
- `docs/decisions/003-production-orders-audit.md`
- `apps/api/prisma/schema.prisma`
