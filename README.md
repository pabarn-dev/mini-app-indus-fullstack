# Industrial Production Pilot

Monorepo Fullstack TypeScript (Next.js + NestJS), projet d'apprentissage d'une stack moderne.
**Phase 1 : socle technique (scaffold), sans fonctionnalité métier.**

Versions de la stack et justifications : voir
[docs/decisions/001-stack-versions.md](docs/decisions/001-stack-versions.md).

## Structure

```
apps/
  web/   Next.js 16 (App Router) + Mantine 9   — port 3000
  api/   NestJS 11 + Prisma 7                   — port 3001
docs/decisions/   ADR (décisions techniques)
docker-compose.yml   PostgreSQL 17
```

## Prérequis

- Node.js 24 LTS (`nvm use` lit `.nvmrc`)
- pnpm via Corepack (`corepack enable`)
- Docker (pour PostgreSQL)

## Installation

```bash
corepack enable
pnpm install
cp .env.example .env
```

## Base de données

PostgreSQL 17 via Docker. Le port hôte est **5433** (pour éviter un conflit avec un
PostgreSQL local éventuel sur 5432).

```bash
docker compose up -d
pnpm --filter api prisma generate
```

Prisma 7 se connecte via le driver adapter `pg` (configuration dans
`apps/api/prisma.config.ts`).

## Démarrage

```bash
pnpm dev   # web (3000) + api (3001) en parallèle
```

- Web : http://localhost:3000
- API (santé) : `GET http://localhost:3001/health` → `{"status":"ok","service":"api"}`

## Scripts (racine)

| Script              | Action                        |
| ------------------- | ----------------------------- |
| `pnpm dev`          | Lance web + api               |
| `pnpm build`        | Build web + api               |
| `pnpm lint`         | ESLint sur l'ensemble du repo |
| `pnpm format`       | Prettier `--write`            |
| `pnpm format:check` | Vérifie le formatage          |
