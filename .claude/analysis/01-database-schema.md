# Analyse du Schema Prisma - Mission Control

**Date**: 2025-12-27
**Fichier analyse**: `packages/shared/prisma/schema.prisma`
**Documentation reference**: `.claude/docs/database.md`

---

## Score Global: 82/100

| Categorie | Score | Poids |
|-----------|-------|-------|
| Completude des modeles | 95/100 | 25% |
| Coherence des relations | 70/100 | 25% |
| Definition des enums | 90/100 | 15% |
| Indexes et performance | 85/100 | 15% |
| Cascades de suppression | 75/100 | 10% |
| Coherence schema/doc | 80/100 | 10% |

---

## 1. Points Positifs

### 1.1 Modeles Complets
Tous les modeles documentes sont presents dans le schema:

| Modele | Present | Lignes |
|--------|---------|--------|
| Mission | Oui | 175-202 |
| Phase | Oui | 204-226 |
| Task | Oui | 37-110 |
| Workflow | Oui | 18-35 |
| Decision | Oui | 112-127 |
| Issue | Oui | 129-142 |
| Milestone | Oui | 144-156 |
| ServerInfo | Oui | 162-168 |

### 1.2 Hierarchie Mission Correcte
```
Mission (1) --> (*) Phase (1) --> (*) Task
```
- Relation `Mission.phases` correctement definie
- Relation `Phase.tasks` correctement definie
- Contrainte unique `@@unique([missionId, number])` sur Phase

### 1.3 Enums Bien Definis (TypeScript)
Les enums sont definis dans `packages/shared/src/index.ts`:

| Enum | Valeurs | Coherent avec Doc |
|------|---------|-------------------|
| MissionProfile | SIMPLE, STANDARD, COMPLEX | Oui |
| MissionStatus | PENDING, IN_PROGRESS, COMPLETED, FAILED, BLOCKED | Oui |
| PhaseStatus | PENDING, IN_PROGRESS, COMPLETED, FAILED | Oui |
| TaskStatus | IN_PROGRESS, SUCCESS, PARTIAL_SUCCESS, FAILED | Oui |
| CallerType | ORCHESTRATOR, SUBAGENT | Oui |
| DecisionCategory | 5 valeurs | Oui |
| IssueType | 5 valeurs | Oui |
| TestsStatus | PASSED, FAILED, NOT_RUN | Oui |

### 1.4 Indexes Performants
```prisma
// Mission
@@index([status])
@@index([createdAt])

// Phase
@@unique([missionId, number])
@@index([missionId])

// Task
@@index([workflowId])
@@index([parentTaskId])
@@index([status])
@@index([startedAt])
@@index([phaseId])
@@index([callerType])
@@index([agentName])
```

### 1.5 Validation Zod Centralisee
- Schemas Zod dans `packages/shared/src/schemas.ts`
- Conversion snake_case (MCP) -> SCREAMING_CASE (DB) dans `packages/mcp-server/src/types/enums.ts`

---

## 2. Issues Critiques

### 2.1 CRITIQUE: Placeholder workflowId pour Mode Mission

**Localisation**: `packages/mcp-server/src/tools/start-task.ts:214`

```typescript
workflowId: workflowId || 'mission-task', // Required field, use placeholder for mission mode
```

**Probleme**:
- `Task.workflowId` est un champ obligatoire avec FK vers Workflow
- En mode mission, un placeholder "mission-task" est utilise
- Ce workflow "mission-task" n'existe pas en base
- La contrainte FK `onDelete: Cascade` ne fonctionnera pas correctement

**Impact**:
- Violation potentielle de l'integrite referentielle
- Les taches mission ne seront pas supprimees en cascade si le workflow phantom est supprime
- Confusion dans les requetes qui joignent Task -> Workflow

**Recommandation**:
```prisma
model Task {
  workflowId   String?  // Rendre optionnel
  // OU
  missionId    String?  // Ajouter FK directe vers Mission
}
```

### 2.2 CRITIQUE: Cascade Incomplete Mission -> Task

**Schema actuel**:
```
Mission -> Phase (onDelete: Cascade)
Phase -> Task (onDelete: Cascade)
```

**Probleme**: Si une Phase est supprimee, les Tasks sont supprimees. MAIS:
- `Task.phaseId` est optionnel (`String?`)
- Une Task peut exister sans Phase (mode legacy)
- Les Tasks avec `phaseId = null` ne beneficient pas de la cascade Mission

**Impact**: Orphelins possibles apres suppression de Mission.

---

## 3. Issues Mineures

### 3.1 Documentation IssueType Incorrecte

**Doc** (`.claude/docs/database.md:21`):
```prisma
enum IssueType { DOC_GAP, BUG, DEPENDENCY_CONFLICT, UNCLEAR_REQUIREMENT, OTHER }
```

**Code** (`packages/shared/src/schemas.ts:70-76`):
```typescript
export const IssueTypeSchema = z.enum([
  'DOC_GAP',
  'BUG',
  'DEPENDENCY_CONFLICT',
  'UNCLEAR_REQUIREMENT',
  'OTHER',
])
```

**Probleme**: La doc utilise `DOC_GAP` mais le schema MCP input utilise `documentation_gap`:
```typescript
// packages/shared/src/schemas.ts:131-137
export const IssueTypeInputSchema = z.enum([
  'documentation_gap',  // Different du doc
  'bug_encountered',    // Different du doc
  ...
])
```

**Impact**: Confusion potentielle pour les developpeurs.

### 3.2 Champs Manquants dans la Doc

La documentation omet certains champs du schema:

| Modele | Champs manquants dans doc |
|--------|---------------------------|
| Mission | `description`, `missionPath` |
| Task | `snapshotId`, `tokensInput`, `tokensOutput`, nombreux champs outcome |
| Milestone | `metadata` |

### 3.3 Self-Reference Task sans onDelete

```prisma
parentTask Task? @relation("TaskHierarchy", fields: [parentTaskId], references: [id])
```

**Probleme**: Pas de `onDelete` specifie. Comportement par defaut: RESTRICT ou NO ACTION selon SQLite.

**Impact**: Impossible de supprimer une Task parent si elle a des subtasks.

### 3.4 WorkflowStatus vs MissionStatus Inconsistance

| Workflow | Mission |
|----------|---------|
| IN_PROGRESS | PENDING, IN_PROGRESS |
| COMPLETED | COMPLETED |
| FAILED | FAILED, BLOCKED |

**Observation**: Workflow n'a pas de statut PENDING ni BLOCKED. Inconsistance conceptuelle mineure.

---

## 4. Coherence Schema/Documentation

### 4.1 Tableau de Conformite

| Element | Schema | Doc | Match |
|---------|--------|-----|-------|
| Mission model | Oui | Oui | Oui |
| Phase model | Oui | Oui | Oui |
| Task.phaseId optional | Oui | Oui | Oui |
| Phase unique constraint | `[missionId, number]` | `[missionId, number]` | Oui |
| Cascade Mission->Phase | Oui | Oui | Oui |
| Cascade Phase->Task | Oui | Oui | Oui |
| Task indexes | 7 | 5 documentes | Partiel |

### 4.2 Enums SQLite Note

Le schema et la doc indiquent correctement:
- SQLite stocke les enums comme TEXT
- Validation cote application via Prisma client
- Types TypeScript definis dans `@mission-control/shared`

---

## 5. Recommandations

### Priorite Haute

1. **Refactoriser Task.workflowId**
   ```prisma
   model Task {
     workflowId   String?  // Optionnel
     workflow     Workflow? @relation(fields: [workflowId], references: [id], onDelete: Cascade)

     missionId    String?  // Nouvelle FK directe
     mission      Mission? @relation(fields: [missionId], references: [id], onDelete: Cascade)
   }
   ```

2. **Ajouter check constraint logique** (cote application):
   ```typescript
   // Exactement un des deux doit etre defini
   if (!workflowId && !missionId) throw new Error('workflowId or missionId required')
   if (workflowId && missionId) throw new Error('Cannot have both')
   ```

### Priorite Moyenne

3. **Ajouter onDelete sur TaskHierarchy**:
   ```prisma
   parentTask Task? @relation("TaskHierarchy", fields: [parentTaskId], references: [id], onDelete: SetNull)
   ```

4. **Mettre a jour la documentation** avec les champs manquants.

5. **Harmoniser IssueType** entre doc et schemas Zod.

### Priorite Basse

6. Ajouter index composite sur Task: `@@index([missionId, phaseId])` pour queries mission.

7. Considerer l'ajout de `PENDING` a WorkflowStatus pour symetrie avec MissionStatus.

---

## 6. Metriques du Schema

```
Modeles:        8
Enums (TS):     8
Relations:      9
Indexes:       16
Cascades:       6
Champs total: ~75
```

---

## 7. Conclusion

Le schema Prisma est **globalement bien concu** pour supporter la fusion workflow/mission. Les points forts sont:
- Hierarchie Mission->Phase->Task correcte
- Enums type-safe via TypeScript
- Indexes performants

Le point critique a corriger est le **placeholder `workflowId: 'mission-task'`** qui brise l'integrite referentielle. Cette refactorisation devrait etre prioritaire avant toute mise en production.

La documentation est coherente a 80% avec le schema, quelques mises a jour mineures sont necessaires.
