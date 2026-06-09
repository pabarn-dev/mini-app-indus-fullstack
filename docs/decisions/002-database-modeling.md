# ADR 002 — Database modeling

- **Statut** : Accepté
- **Date** : 2026-06-09
- **Contexte** : socle de données de la Phase 2 pour Industrial Production Pilot.
  Domaine industriel avec exigence de **traçabilité** (production, lots, contrôles qualité,
  audit). Ce document justifie les arbitrages ; l'état du schéma est décrit dans
  [docs/database.md](../database.md). Versions de la stack : [ADR 001](001-stack-versions.md).

## Décisions

### D1 — Identifiants : `String @default(uuid(7))`

- **Choix** : UUID v7 pour toutes les clés primaires.
- **Alternatives** : `cuid(2)`, `uuid(4)`, `Int @default(autoincrement())`.
- **Raison** : UUID v7 est ordonné dans le temps → bonne localité d'index (contrairement à
  v4), pas d'ID séquentiel devinable (contrairement à l'autoincrement). Validé compatible
  Prisma 7. Fallback `cuid(2)` documenté si besoin (non utilisé).

### D2 — AuditLog polymorphe, sans clé étrangère

- **Choix** : un seul journal `AuditLog(entityType, entityId, metadata jsonb)`, `entityId`
  **sans FK**.
- **Alternatives** : une table d'audit par modèle ; FK réelle par entité auditée.
- **Raison** : un journal unique, générique et extensible à toute entité, sans coût de
  jointure multiple ni explosion du nombre de tables. Le compromis (pas d'intégrité
  référentielle sur `entityId`) est assumé : la cohérence est garantie par les use cases.

### D3 — Chaîne de production en `onDelete: Restrict`

- **Choix** : `Machine → ProductionOrder → Batch → QualityCheck` toutes en `Restrict`.
- **Alternative rejetée** : `Cascade` (envisagée initialement).
- **Raison** : en contexte industriel, lots et contrôles qualité **ne doivent pas
  disparaître** avec leur parent. `Restrict` protège l'historique au niveau base. Le cycle
  de vie métier passe par `CANCELLED`, pas par la suppression physique.

### D4 — Références utilisateur en `onDelete: SetNull`

- **Choix** : `createdBy`, `checkedBy`, `AuditLog.user` passent à `null` si le `User` est supprimé.
- **Raison** : préserver la donnée de production et l'audit même si un compte disparaît.
  Les colonnes FK correspondantes sont donc nullable.

### D5 — `Batch(productionOrderId, sequence)` unique

- **Choix** : numéro de lot séquentiel, unique par ordre de production.
- **Raison** : numérotation lisible et stable des lots, sans doublon, indépendante de l'ID technique.

### D6 — Quantités en `Int`

- **Choix** : `targetQuantity`, `quantityProduced` en entiers.
- **Raison** : unités entières suffisantes pour la V1. Passage à `Decimal` différé tant que
  des quantités fractionnaires ne sont pas requises.

### D7 — `passwordHash` nullable maintenant

- **Choix** : champ présent mais nullable, sans auth.
- **Raison** : éviter une migration en Phase 6 tout en n'imposant aucune authentification
  aujourd'hui. Stratégie de mots de passe de dev : voir [docs/dev-access.md](../dev-access.md).

## Conséquences

- Pas de suppression physique en pratique : le workflow s'appuie sur le statut `CANCELLED`.
- La cohérence de l'audit (validité de `entityId`, action) est portée par la couche
  application, pas par la base.
- Toute évolution du modèle passe par une **nouvelle migration** (les migrations appliquées
  sont immuables) et doit être répercutée dans [docs/database.md](../database.md).
