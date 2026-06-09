# ADR 001 — Stack & versions

- **Statut** : Accepté
- **Date** : 2026-06-09
- **Contexte** : Industrial Production Pilot — monorepo Fullstack TypeScript (Next.js + NestJS).

## Décision

Construire le projet sur des versions **récentes, stables et maintenables**, sans
dépendance expérimentale (aucune `beta` / `rc` / `canary` / `alpha`), avec des
**versions exactes figées** dans les `package.json` et un lockfile committé.

## Matrice retenue (vérifiée le 2026-06-09 via le registre npm)

| Composant  | Version  | Justification courte                                                         |
| ---------- | -------- | ---------------------------------------------------------------------------- |
| Node.js    | 24.x LTS | LTS actif (oct. 2025 → ~2028). Node 20 en fin de vie. Aligné sur la machine. |
| pnpm       | 10.34.1  | Ligne stable mature (`latest-10`), un cran derrière la dernière (maîtrise).  |
| TypeScript | 5.9.3    | Dernière 5.x, supportée par tout l'écosystème (Nest/Next/SWC/eslint).        |
| Next.js    | 16.2.7   | Dernière stable, App Router mûr.                                             |
| React      | 19.2.7   | **Imposé par Mantine 9** (`react ^19.2.0`).                                  |
| NestJS     | 11.1.26  | Dernière stable.                                                             |
| Prisma     | 7.8.0    | Dernière stable (`prisma` + `@prisma/client`).                               |
| PostgreSQL | 17       | Très mûr, image `postgres:17-alpine` fiable.                                 |
| Mantine    | 9.3.1    | Dernière stable (`@mantine/core`, `hooks`, `form`).                          |
| Vitest     | 4.1.8    | Dernière stable.                                                             |
| Playwright | 1.60.0   | Dernière stable.                                                             |

## Vérifications de compatibilité

**Chaîne React / Next / Mantine**

- `@mantine/core@9.3.1` → peer `react ^19.2.0`, `react-dom ^19.2.0`
- `next@16.2.7` → peer `react ^18.2.0 || ^19.0.0`
- Intersection → **React 19.2.7** satisfait les deux. ✅

**Chaîne Node / NestJS / Prisma**

- `prisma@7.8.0` / `@prisma/client@7.8.0` → engines `^20.19 || ^22.12 || >=24.0`
- `@nestjs/core@11.1.26` → engines `>= 20`
- `next@16.2.7` → engines `>=20.9.0`
- Contrainte la plus stricte = Prisma (`>=24.0`) → **Node 24** satisfait l'intersection. ✅

**Outillage**

- `typescript-eslint@8.61.0` → peer `typescript >=4.8.4 <6.1.0` → couvre 5.9 (et 6.0). ✅
- `vitest@4.1.8` → engines `^20 || ^22 || >=24`. ✅

## Choix volontairement « un cran en arrière » (maîtrise)

| Composant   | Dernière publiée | Retenu  | Raison                                         |
| ----------- | ---------------- | ------- | ---------------------------------------------- |
| pnpm        | 11.5.2           | 10.34.1 | Plus de recul sur la ligne 10.                 |
| TypeScript  | 6.0.3            | 5.9.3   | Major TS récent ; éviter friction SWC/ts-node. |
| PostgreSQL  | 18               | 17      | Plus de recul en production.                   |
| @types/node | 25.x             | 24.13.1 | Aligné sur le runtime Node 24.                 |

## Conséquences

- Mises à jour **manuelles** (versions exactes) — un outil type Renovate pourra être
  ajouté plus tard pour automatiser les bumps.
- La contrainte initiale « React 18 » est **abandonnée** : Mantine 9 impose React 19.
- `engines.node = ">=24 <25"` dans le `package.json` racine ; `.nvmrc = 24.14.1`.
