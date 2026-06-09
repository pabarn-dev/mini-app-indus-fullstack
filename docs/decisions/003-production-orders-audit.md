# ADR 003 — Production Orders : transitions, audit transactionnel & MachineGateway

- **Statut** : Accepté
- **Date** : 2026-06-09
- **Contexte** : module Production Orders (Phase 4). Cycle de vie à statuts avec exigence de
  **traçabilité** (AuditLog) et de cohérence avec les machines. État du schéma :
  [docs/database.md](../database.md).

## Décisions

### D1 — Machine à états dans le domaine, règles inter-agrégats dans les use cases

- Transitions : `DRAFT → PLANNED → IN_PROGRESS → COMPLETED`, et `→ CANCELLED` depuis tout état
  non terminal. `COMPLETED`/`CANCELLED` terminaux. Transition invalide →
  `InvalidProductionOrderTransitionError` (409).
- L'entité `ProductionOrder` est **immuable** (`plan/start/complete/cancel` renvoient une
  nouvelle instance et posent `plannedAt/startedAt/completedAt`).
- Les règles **inter-agrégats** (statut machine) vivent dans les **use cases**, pas dans le domaine.

### D2 — Règles machine

- Création : machine **existante** et **≠ DISABLED** (`MachineNotFoundForProductionOrderError`
  404 / `MachineNotUsableForProductionOrderError` 409).
- Démarrage (`start`) : machine **ACTIVE** requise.

### D3 — MachineGateway = read model minimal

- Port `MachineGateway` renvoie `{ id, status, isUsable }` ; l'adapter (infra) délègue au
  `MachineRepository` de Machines. **Aucun type Prisma ni entité Machine** n'entre dans
  l'application de Production Orders.

### D4 — Audit transactionnel (point critique)

- Chaque transition réussie écrit un `AuditLog` `STATUS_CHANGE` / `PRODUCTION_ORDER` /
  `entityId = order.id` / `metadata = { from, to }` / `userId = null`.
- **Pas d'audit à la création** (création ≠ transition).
- L'update de l'ordre **et** l'insert de l'audit s'exécutent dans **une seule transaction**.
- Mécanisme : port `TransactionRunner` (`run<T>(work)`) ; impl Prisma via `$transaction` +
  **AsyncLocalStorage**. `PrismaService.db` renvoie le client de la transaction courante
  (sinon le client de base) ; repository et audit writer écrivent via `prisma.db`.
- **Rollback testé en intégration** : si une erreur est levée après update + audit, ni le statut
  ni l'AuditLog ne sont persistés.

## Conséquences

- `IdGenerator`, `Clock`, `TransactionRunner` sont des **ports partagés** (`src/shared/application/ports`).
- Le client Prisma 7 étant un Proxy, `PrismaService` **capture le client-proxy** (`baseClient`)
  pour que le getter `db` expose des delegates valides (sans `any`).
- `userId` restera `null` jusqu'à l'authentification (Phase 6).
