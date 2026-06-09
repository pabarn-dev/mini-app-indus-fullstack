# CLAUDE.md

Contexte projet pour les sessions Claude. Réponses courtes et factuelles.

## Projet

**Industrial Production Pilot** — application industrielle V1, monorepo Fullstack
TypeScript, pour démontrer une stack moderne et une architecture propre (DDD / hexagonal).

## Objectif

Piloter une production industrielle (machines, ordres de production, lots, contrôles
qualité, audit) avec un backend testable et maintenable, puis un frontend.

## Stack actuelle

- Monorepo pnpm (Corepack), Node.js 24 LTS, TypeScript 5.9 strict
- Backend : NestJS 11, Prisma 7 (driver adapter `pg`), PostgreSQL 17 (Docker, port hôte 5433)
- Frontend : Next.js 16, React 19.2, Mantine 9 (page d'accueil uniquement)
- Qualité : ESLint (flat config), Prettier, Vitest (unitaire + intégration)
- Détails et justifications des versions : `docs/decisions/001-stack-versions.md`

## État d'avancement

- Phase 1 (init monorepo) — **terminée**
- Phase 2 (base de données Prisma) — **terminée**
- Phase 3 (module Machines) — **en cours**
  - Lots 3A → 3E terminés (domaine, use cases, infra Prisma, presentation)
  - Lot en cours : **3F — Tests & vérifications Machines**

## Règles de travail avec l'agent

- Toujours proposer un plan avant toute modification.
- Ne pas modifier plus de 3 à 5 fichiers sans validation (sauf validation explicite).
- Pas de `any`. TypeScript strict.
- Pas de logique métier dans les controllers.
- Pas de type Prisma hors infrastructure.
- DTO uniquement dans presentation.
- Domaine indépendant de NestJS, Prisma et HTTP.
- Use cases sans logique technique.
- Ne pas lancer de migration ni reset DB sans validation.
- Pas d'UI tant que le backend n'est pas stable.
- Réponses courtes et factuelles.

## Architecture backend attendue

```
apps/api/src/
  modules/<feature>/
    domain/          entités, value objects, erreurs (pur, sans framework)
    application/     use cases + ports (interfaces + tokens DI)
    infrastructure/  Prisma (repository + mapper)
    presentation/    controllers, DTO, filtres
    <feature>.module.ts
  infrastructure/    PrismaService, IdGenerator (UUIDv7), Clock (partagés)
```

- Domaine : ne dépend pas de NestJS / Prisma / HTTP.
- Application : orchestre via ports ; use cases sans décorateur Nest (DI via `useFactory`).
- Infrastructure : seul endroit avec Prisma ; mapper Prisma ↔ domaine obligatoire.
- Presentation : controllers fins + DTO (class-validator) + mapping erreurs (`DomainExceptionFilter`).

## Commandes utiles

```bash
pnpm install
docker compose up -d                   # PostgreSQL 17 (port 5433)
pnpm --filter api prisma generate
pnpm --filter api db:seed              # seed idempotent
pnpm --filter api test                 # tests unitaires (sans DB)
pnpm --filter api test:integration     # repository + e2e (DB requise)
pnpm --filter api build
pnpm dev                               # web (3000) + api (3001)
pnpm lint && pnpm format:check
```

## À lire avant toute modification

- `README.md`
- `docs/database.md`
- `docs/dev-access.md`
- `docs/decisions/001-stack-versions.md`
- `docs/decisions/002-database-modeling.md`
- `apps/api/prisma/schema.prisma`
- `CLAUDE.md`

## Prochaine étape

Finaliser le **Lot 3F** (e2e HTTP + vérifications). Ensuite : **Phase 4 — module Production
Orders** (statuts, transitions, AuditLog).
