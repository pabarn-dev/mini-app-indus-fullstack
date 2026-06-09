# Roadmap

Vue d'ensemble des phases. Objectif court par phase, sans détail excessif.
État détaillé du module en cours : voir [`CLAUDE.md`](../CLAUDE.md).

**Légende** : ✅ terminée · ⏳ prochaine · ⬜ prévue

| Phase | Nom                           | Statut | Objectif court                                                                                              |
| ----- | ----------------------------- | ------ | ----------------------------------------------------------------------------------------------------------- |
| 1     | Foundation                    | ✅     | Monorepo pnpm, TypeScript strict, NestJS + Next.js, Docker, ESLint/Prettier.                                |
| 2     | Database                      | ✅     | Modèles Prisma, migration `init`, seed idempotent, documentation base.                                      |
| 3     | Machines                      | ✅     | Premier module métier (CRUD + statut), architecture hexagonale, tests.                                      |
| 4     | Production Orders             | ✅     | Ordres + transitions de statut, AuditLog transactionnel, tests e2e.                                         |
| 5     | Batches & Quality Checks      | ⏳     | Lots depuis un ordre + quantité produite ; contrôles qualité ; bloquer la complétion si un contrôle FAILED. |
| 6     | Auth / rôles / sécurité API   | ⬜     | JWT simple, rôles ADMIN/OPERATOR/VIEWER, guards NestJS.                                                     |
| 7     | Frontend Next.js              | ⬜     | Écrans métier (machines, ordres), services API séparés, formulaires Zod.                                    |
| 8     | Dashboard / UX métier         | ⬜     | Vue d'ensemble, historique d'audit, états loading / error / empty.                                          |
| 9     | CI / GitHub Actions / qualité | ⬜     | lint, typecheck, test, build en CI ; stratégie de tests documentée.                                         |
| 10    | README final / polish         | ⬜     | Documentation finale, captures d'écran, limites connues (préparation portfolio).                            |

## Notes

- L'ordre peut évoluer ; le frontend n'est développé que lorsque le backend est stable.
- Chaque phase est découpée en petits lots validés un par un (cf. règles dans `CLAUDE.md`).
