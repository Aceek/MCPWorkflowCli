# Audit SQLite - MCP Workflow Tracker

**Date** : 2025-12-02
**Version analysée** : `feat/mcpTool` branch (commit a88ad15)
**Objectif** : Valider si l'implémentation SQLite est propre, bien pensée et state-of-the-art

---

## Contexte

Suite au hotfix qui a restauré SQLite comme provider de base de données (après une migration malencontreuse vers PostgreSQL), cet audit vérifie la propreté de l'implémentation SQLite.

**SQLite a été choisi pour** :
- Distribution standalone npm (pas de Docker/PostgreSQL requis)
- Simplicité d'installation pour les utilisateurs finaux
- Fichier de base de données portable

**Contraintes SQLite** :
- Pas d'enums natifs (stockés comme `TEXT`)
- Pas d'arrays natifs (stockés comme JSON strings)
- Pas de type `Json` natif (stocké comme `TEXT`)

---

## Score Global : 6.5/10

| Critère | Score | Commentaire |
|---------|-------|-------------|
| Helpers JSON centralisés | 4/10 | Existent mais **non utilisés** dans mcp-server |
| Cohérence d'utilisation | 5/10 | Web-UI bien, mcp-server mal |
| DRY (pas de duplication) | 3/10 | JSON.stringify éparpillé partout |
| Types TypeScript corrects | 7/10 | Schéma Prisma correct, usage incohérent |
| Enums centralisés | 9/10 | Excellente organisation |
| Risques de bugs | 5/10 | Catch silencieux, pas de validation |

---

## Analyse Détaillée

### 1. Helpers JSON

#### mcp-server/src/utils/json-fields.ts (EXISTE MAIS NON UTILISÉ)

Le fichier définit des helpers bien conçus :

```typescript
// Helpers disponibles mais NON UTILISÉS
toJsonArray<T>(arr: T[] | undefined | null): string
fromJsonArray<T>(json: string | null | undefined): T[]
toJsonObject<T extends object>(obj: T | undefined | null): string | null
fromJsonObject<T extends object>(json: string | null | undefined): T | null
taskFieldsToJson(fields: {...}): Partial<TaskJsonFields>
taskFieldsFromJson(task: {...}): {...}
decisionFieldsToJson(fields: {...}): {...}
decisionFieldsFromJson(decision: {...}): {...}
workflowPlanToJson(plan: unknown[] | null | undefined): string | null
workflowPlanFromJson(plan: string | null | undefined): unknown[] | null
```

**Problème critique** : Ces helpers ne sont importés nulle part dans mcp-server !

#### web-ui/src/lib/json-parse.ts (UTILISÉ CORRECTEMENT)

```typescript
parseJsonArray<T = string>(value: unknown): T[]
parseJsonObject<T = Record<string, unknown>>(value: unknown): T | null
```

**Usage** : Utilisé dans 3 composants (DecisionCard, TaskCard, RealtimeWorkflowDetail).

| Sévérité | Problème | Recommandation |
|----------|----------|----------------|
| 🔴 | Helpers mcp-server non utilisés | Utiliser `taskFieldsToJson()` dans les tools |
| 🟠 | Duplication helpers mcp-server vs web-ui | Centraliser dans `@mcp-tracker/shared` |

---

### 2. Utilisation de JSON.stringify/parse dans mcp-server

#### Analyse quantitative

| Fichier | JSON.stringify | JSON.parse | Helpers utilisés |
|---------|----------------|------------|------------------|
| complete-task.ts | 14 | 2 | 0 |
| start-task.ts | 3 | 0 | 0 |
| log-decision.ts | 2 | 0 | 0 |
| log-milestone.ts | 1 | 0 | 0 |
| start-workflow.ts | 1 | 0 | 0 |
| **TOTAL** | **21** | **2** | **0** |

#### Exemples de code problématique

**complete-task.ts:218-234** - 14 JSON.stringify bruts :
```typescript
// ❌ MAUVAIS : JSON.stringify répété 14 fois
achievements: JSON.stringify(validated.outcome.achievements ?? []),
limitations: JSON.stringify(validated.outcome.limitations ?? []),
nextSteps: JSON.stringify(validated.outcome.next_steps ?? []),
packagesAdded: JSON.stringify(validated.metadata?.packages_added ?? []),
packagesRemoved: JSON.stringify(validated.metadata?.packages_removed ?? []),
commandsExecuted: JSON.stringify(validated.metadata?.commands_executed ?? []),
filesAdded: JSON.stringify(filesAdded),
filesModified: JSON.stringify(filesModified),
filesDeleted: JSON.stringify(filesDeleted),
unexpectedFiles: JSON.stringify(scopeVerification.unexpectedFiles),
warnings: JSON.stringify(scopeVerification.warnings),
```

**Solution** : Utiliser `taskFieldsToJson()` qui existe déjà !

```typescript
// ✅ BON : Utiliser le helper centralisé
import { taskFieldsToJson } from '../utils/json-fields.js'

const jsonFields = taskFieldsToJson({
  achievements: validated.outcome.achievements ?? [],
  limitations: validated.outcome.limitations ?? [],
  // ... autres champs
})

await prisma.task.update({
  where: { id: validated.task_id },
  data: {
    ...jsonFields,
    // autres champs non-JSON
  }
})
```

| Sévérité | Problème | Recommandation |
|----------|----------|----------------|
| 🔴 | 21 JSON.stringify éparpillés | Refactoriser avec helpers existants |
| 🔴 | Violation massive du principe DRY | Effort : ~2h pour tout centraliser |

---

### 3. Gestion des Enums

#### shared/src/index.ts (EXCELLENT)

```typescript
export const WorkflowStatus = {
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED',
  FAILED: 'FAILED',
} as const
export type WorkflowStatus = (typeof WorkflowStatus)[keyof typeof WorkflowStatus]
```

**Pattern utilisé** : `as const` + type inféré = type safety sans enum TypeScript natif.

#### mcp-server/src/types/enums.ts (EXCELLENT)

```typescript
import {
  WorkflowStatus,
  TaskStatus,
  DecisionCategory,
  IssueType,
  TestsStatus,
} from '@mcp-tracker/shared'

// Maps de conversion centralisées
export const taskStatusMap: Record<string, TaskStatus> = {
  success: TaskStatus.SUCCESS,
  partial_success: TaskStatus.PARTIAL_SUCCESS,
  failed: TaskStatus.FAILED,
}
```

**Points forts** :
- Enums importés depuis `@mcp-tracker/shared` (source unique de vérité)
- Maps de conversion MCP input → Prisma enum centralisées
- Ré-exports pour faciliter les imports dans les tools

| Sévérité | État | Commentaire |
|----------|------|-------------|
| ✅ | Excellent | Architecture propre et maintenable |

---

### 4. Types TypeScript pour SQLite

#### Schéma Prisma (CORRECT)

```prisma
model Task {
  areas         String @default("[]")  // JSON array
  achievements  String @default("[]")  // JSON array
  snapshotData  String?                // JSON object
}
```

**Correct** : Les champs sont typés `String` car SQLite stocke du texte.

#### Problème : Types à l'exécution

Dans `complete-task.ts:195` :
```typescript
// Typage implicite via inférence
const taskAreas: string[] = task.areas ? JSON.parse(task.areas) : []
```

**Risque** : Si le JSON est mal formé, `JSON.parse` throw une exception non catchée.

| Sévérité | Problème | Recommandation |
|----------|----------|----------------|
| 🟠 | JSON.parse sans try/catch | Utiliser `fromJsonArray()` qui gère les erreurs |

---

### 5. Risques de Bugs Identifiés

#### 5.1 Catch silencieux dans json-fields.ts

```typescript
// json-fields.ts:22-26
try {
  const parsed = JSON.parse(json)
  return Array.isArray(parsed) ? parsed : []
} catch {
  return []  // ⚠️ Erreur silencieuse
}
```

**Risque** : Si un JSON est corrompu, l'erreur est masquée et le code continue avec un tableau vide.

**Recommandation** : Ajouter un logging optionnel :
```typescript
} catch (error) {
  console.warn('[json-fields] Failed to parse JSON array:', error)
  return []
}
```

#### 5.2 JSON.parse non protégé dans complete-task.ts

```typescript
// complete-task.ts:182-183
const snapshotData: GitSnapshotData | null = task.snapshotData
  ? JSON.parse(task.snapshotData)  // ⚠️ Peut throw
  : null
```

**Risque** : Si `snapshotData` contient du JSON invalide, le tool crash.

#### 5.3 Pas de validation de structure JSON

```typescript
// complete-task.ts:195
const taskAreas: string[] = task.areas ? JSON.parse(task.areas) : []
```

**Risque** : Si `areas` contient `"invalid"` au lieu de `["array"]`, le code crash.

| Sévérité | Problème | Recommandation |
|----------|----------|----------------|
| 🔴 | 3 catch silencieux | Ajouter logging |
| 🔴 | 2 JSON.parse non protégés | Utiliser helpers avec try/catch |
| 🟠 | Pas de validation de structure | Ajouter validation Zod pour les lectures |

---

## Comparaison avec State of the Art

### Pattern Recommandé pour SQLite + Prisma

```typescript
// 1. Types stricts pour les champs JSON
interface TaskJsonFields {
  areas: string[]
  achievements: string[]
  // ...
}

// 2. Helpers centralisés avec validation
function parseTaskJsonFields(task: Task): TaskJsonFields {
  return {
    areas: safeParseArray(task.areas),
    achievements: safeParseArray(task.achievements),
  }
}

function safeParseArray<T>(json: string | null, schema?: z.ZodSchema<T[]>): T[] {
  if (!json) return []
  try {
    const parsed = JSON.parse(json)
    if (!Array.isArray(parsed)) return []
    if (schema) return schema.parse(parsed)
    return parsed
  } catch (error) {
    logger.warn('Failed to parse JSON array', { json, error })
    return []
  }
}
```

### Ce qui manque actuellement

| Fonctionnalité | État Actuel | State of the Art |
|----------------|-------------|------------------|
| Helpers centralisés | Existent mais non utilisés | Utilisés partout |
| Gestion d'erreur JSON | Catch silencieux | Logging + fallback |
| Validation structure | Aucune | Zod schemas |
| Types runtime | string[] inféré | Types validés |

---

## Plan de Correction Priorisé

### P1 - Critiques (Effort : ~4h)

| # | Action | Fichiers | Effort |
|---|--------|----------|--------|
| 1 | Utiliser `taskFieldsToJson()` dans complete-task.ts | 1 fichier | 1h |
| 2 | Utiliser `toJsonArray()` dans start-task.ts | 1 fichier | 30min |
| 3 | Utiliser `decisionFieldsToJson()` dans log-decision.ts | 1 fichier | 30min |
| 4 | Utiliser `fromJsonArray()` pour les JSON.parse | 2 fichiers | 1h |
| 5 | Ajouter logging dans les catch silencieux | json-fields.ts | 30min |

### P2 - Importants (Effort : ~3h)

| # | Action | Fichiers | Effort |
|---|--------|----------|--------|
| 6 | Centraliser helpers JSON dans `@mcp-tracker/shared` | 3 fichiers | 2h |
| 7 | Supprimer duplication web-ui/lib/json-parse.ts | 2 fichiers | 1h |

### P3 - Améliorations (Effort : ~2h)

| # | Action | Fichiers | Effort |
|---|--------|----------|--------|
| 8 | Ajouter validation Zod pour les structures JSON | json-fields.ts | 1h |
| 9 | Documenter le pattern SQLite dans CLAUDE.md | 1 fichier | 1h |

---

## Références PostgreSQL Trouvées (Tâche 2)

### Fichiers à supprimer/modifier

| Fichier | Action | Raison |
|---------|--------|--------|
| `docker-compose.yml` | Supprimer | PostgreSQL container |
| `README.md:35,52,70,74,82` | Modifier | Références PostgreSQL |
| `.claude/docs/database.md` | Modifier | Documentation multi-DB |
| `.claude/docs/architecture.md:40` | Modifier | Diagramme montre PostgreSQL |
| `documentations/IMPLEMENTATION-CHECKLIST.md` | Modifier | Instructions PostgreSQL |
| `documentations/INDEX.md:50` | Modifier | Mention multi-DB |
| `.claude/CLAUDE.md:55-61` | Modifier | Section Database |

**Note** : Les fichiers `*.postgresql.*` dans `node_modules/` sont des fichiers internes de Prisma et ne doivent PAS être supprimés.

---

## Conclusion

L'implémentation SQLite actuelle a une **bonne base** (enums centralisés, helpers existants) mais souffre d'une **dette technique significative** :

1. **Helpers non utilisés** : Le code le plus DRY existe mais n'est pas appliqué
2. **JSON.stringify éparpillé** : 21 occurrences au lieu d'appels centralisés
3. **Gestion d'erreur faible** : Catch silencieux et JSON.parse non protégés

**Recommandation** : Corriger les P1 avant d'ajouter de nouvelles features (~4h d'effort).

---

**Généré le** : 2025-12-02
**Par** : Audit SQLite Task
