# Remaining Issues - Post-Correction Audit

**Date** : 2 Décembre 2025
**Audit Post-Corrections** : 5 batches appliqués
**Score Global** : 8.2/10

---

## Synthèse des Scores

| Package | Score | Problèmes Critiques | Problèmes Importants | Problèmes Mineurs |
|---------|-------|---------------------|----------------------|-------------------|
| **shared** | 8.0/10 | 1 | 1 | 1 |
| **mcp-server** | 8.5/10 | 0 | 1 | 3 |
| **web-ui** | 8.2/10 | 0 | 1 | 3 |
| **TOTAL** | **8.2/10** | **1** | **3** | **7** |

---

## Package : shared

### 🔴 CRITIQUE (1)

#### SHARED-C01 : Duplication d'Enums Sans Synchronisation

**Fichiers** :
- `packages/shared/src/index.ts` (lignes 56-94)
- `packages/shared/src/schemas.ts` (lignes 23-85)

**Description** :
Les 5 enums principaux sont maintenus en DEUX copies indépendantes :

**Copie 1 - index.ts (const objects)** :
```typescript
export const WorkflowStatus = {
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED',
  FAILED: 'FAILED',
} as const
export type WorkflowStatus = (typeof WorkflowStatus)[keyof typeof WorkflowStatus]
```

**Copie 2 - schemas.ts (Zod schemas)** :
```typescript
export const WorkflowStatusSchema = z.enum([
  'IN_PROGRESS',
  'COMPLETED',
  'FAILED',
])
```

**Risque** :
- Si quelqu'un ajoute une valeur dans un fichier mais pas l'autre
- TypeScript ne détecte pas la désynchronisation
- Les validations Zod rejetteront la nouvelle valeur
- Runtime error pour les tools MCP

**Enums concernés** :
1. WorkflowStatus (3 valeurs)
2. TaskStatus (4 valeurs)
3. DecisionCategory (5 valeurs)
4. IssueType (5 valeurs)
5. TestsStatus (3 valeurs)

**Recommandation** :
```typescript
// Option 1 : Dériver les const objects depuis Zod
export const WorkflowStatusSchema = z.enum(['IN_PROGRESS', 'COMPLETED', 'FAILED'])
export type WorkflowStatus = z.infer<typeof WorkflowStatusSchema>
export const WorkflowStatus = {
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED',
  FAILED: 'FAILED',
} as const satisfies Record<WorkflowStatus, WorkflowStatus>  // Type check!

// Option 2 : Test de cohérence en CI
describe('Enum Coherence', () => {
  test('WorkflowStatus has same values as schema', () => {
    const schemaValues = WorkflowStatusSchema.options
    const enumValues = Object.values(WorkflowStatus)
    expect(enumValues).toEqual(expect.arrayContaining(schemaValues))
  })
})
```

**Effort** : 30 min
**Impact** : Data integrity

---

### 🟠 IMPORTANT (1)

#### SHARED-I01 : Fichier .env Committé

**Fichier** : `packages/shared/.env`

**Description** :
Le fichier `.env` est présent dans le repository bien qu'il soit listé dans `.gitignore`. Il contient :
```bash
DATABASE_URL="file:./mcp-tracker.db"

# PostgreSQL (for web-ui shared deployment, uncomment if needed)
# DATABASE_URL="postgresql://mcp_user:mcp_password@localhost:5433/mcp_tracker?schema=public"
```

**Risque** :
- Credentials PostgreSQL visibles (même commentées)
- Mauvaise pratique de versionner des fichiers .env
- Confusion pour les contributeurs

**Recommandation** :
- Vérifier si le fichier est réellement tracké : `git ls-files packages/shared/.env`
- Si oui : `git rm --cached packages/shared/.env`
- Remplacer les credentials PostgreSQL par des placeholders génériques dans `.env.example`

**Effort** : 5 min
**Impact** : Sécurité/Hygiène

---

### 🟡 MINEUR (1)

#### SHARED-M01 : Version Zod Ancienne

**Fichier** : `packages/shared/package.json` (ligne 34)

**Description** :
```json
"zod": "^4.1.13"
```

Zod v5.x est disponible depuis juin 2024 avec des améliorations de performance.

**Recommandation** :
```bash
cd packages/shared && pnpm update zod
```

**Effort** : 10 min (vérifier compatibilité)
**Impact** : Maintenance

---

## Package : mcp-server

### 🟠 IMPORTANT (1)

#### MCP-I01 : Git Diff Échoue Silencieusement

**Fichier** : `packages/mcp-server/src/utils/git-snapshot.ts`

**Lignes** : 155-177 (`getCommittedDiff`), 183-198 (`getWorkingTreeDiff`)

**Description** :
Si une commande `git diff` échoue (hash invalide, repo corrompu), la fonction retourne un objet vide au lieu de lever une erreur :

```typescript
async function getCommittedDiff(git: SimpleGit, startHash: string): Promise<GitDiffResult> {
  try {
    const currentHead = await git.revparse(['HEAD'])
    if (startHash.trim() === currentHead.trim()) {
      return { added: [], modified: [], deleted: [] }
    }
    const diff = await git.diff([startHash, 'HEAD', '--name-status'])
    return parseDiffOutput(diff)
  } catch (error) {
    logger.error('Failed to get committed diff', { startHash, error... })
    return { added: [], modified: [], deleted: [] }  // ← Retourne vide au lieu de throw!
  }
}
```

**Risque** :
- `complete_task` reçoit "no files changed" même si l'opération a échoué
- L'agent pense n'avoir rien modifié (faux!)
- Audit de workflow incomplet

**Recommandation** :
```typescript
} catch (error) {
  logger.error('Failed to get committed diff', { startHash, error... })
  throw new GitError(`Failed to compute committed diff: ${error instanceof Error ? error.message : String(error)}`)
}
```

**Effort** : 15 min
**Impact** : Data integrity

---

### 🟡 MINEUR (3)

#### MCP-M01 : JSDoc Incomplet

**Fichier** : `packages/mcp-server/src/index.ts`

**Ligne** : 103-129 (`handleToolCall`)

**Description** :
Fonction publique de routage des tool calls sans documentation JSDoc.

**Recommandation** :
```typescript
/**
 * Route MCP tool calls to appropriate handlers
 *
 * @param name - Tool name (start_workflow, start_task, etc.)
 * @param args - Tool arguments (validated by individual handlers)
 * @returns CallToolResult with success/error response
 */
async function handleToolCall(name: string, args: unknown): Promise<CallToolResult>
```

**Effort** : 5 min
**Impact** : Documentation

---

#### MCP-M02 : Pattern Répétitif dans les Tools

**Fichiers** : Tous les tools (start-workflow.ts, start-task.ts, log-decision.ts, log-issue.ts, log-milestone.ts)

**Description** :
Vérification d'existence task/workflow répétée 5 fois :
```typescript
const task = await prisma.task.findUnique({ where: { id: validated.task_id } })
if (!task) throw new NotFoundError(`Task not found: ${validated.task_id}`)
```

**Recommandation** :
Créer des helpers dans `utils/` :
```typescript
// utils/db-helpers.ts
export async function ensureTaskExists(taskId: string): Promise<Task> {
  const task = await prisma.task.findUnique({ where: { id: taskId } })
  if (!task) throw new NotFoundError(`Task not found: ${taskId}`)
  return task
}

export async function ensureWorkflowExists(workflowId: string): Promise<Workflow> {
  const workflow = await prisma.workflow.findUnique({ where: { id: workflowId } })
  if (!workflow) throw new NotFoundError(`Workflow not found: ${workflowId}`)
  return workflow
}
```

**Effort** : 20 min
**Impact** : DRY

---

#### MCP-M03 : Émission Dupliquée STATS_UPDATED

**Fichier** : `packages/mcp-server/src/websocket/events.ts`

**Lignes** : 89-98, 103-118

**Description** :
`STATS_UPDATED` est émis après chaque `WORKFLOW_CREATED` ET `WORKFLOW_UPDATED` :
```typescript
function emitWorkflowCreated(workflow) {
  io.emit(EVENTS.WORKFLOW_CREATED, event)
  io.emit(EVENTS.STATS_UPDATED, { timestamp: ... })  // ← Toujours
}

function emitWorkflowUpdated(workflow) {
  io.emit(EVENTS.WORKFLOW_UPDATED, event)
  io.emit(EVENTS.STATS_UPDATED, { timestamp: ... })  // ← Aussi
}
```

**Risque** :
- 2-3 émissions `STATS_UPDATED` par opération
- Inefficacité réseau (minor)

**Recommandation** :
- Émettre `STATS_UPDATED` uniquement dans `complete_task` (quand les stats changent réellement)
- Ou créer helper `emitStatsIfNeeded()` avec debounce

**Effort** : 15 min
**Impact** : Performance

---

## Package : web-ui

### 🟠 IMPORTANT (1)

#### WEBUI-I01 : AnimatedCounter - startTime Non Initialisé

**Fichier** : `packages/web-ui/src/components/ui/motion.tsx`

**Ligne** : 207

**Description** :
```typescript
export function AnimatedCounter({ value, duration = 1, className }: AnimatedCounterProps) {
  const [displayValue, setDisplayValue] = React.useState(0)

  React.useEffect(() => {
    let startTime: number  // ← Non initialisé!
    let animationFrame: number

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp  // ← Condition truthy/falsy
      const progress = Math.min((timestamp - startTime) / (duration * 1000), 1)
      setDisplayValue(Math.floor(progress * value))

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate)
      }
    }

    animationFrame = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(animationFrame)
  }, [value, duration])

  return <span className={className}>{displayValue}</span>
}
```

**Risque** :
- `startTime` non initialisé peut causer comportement inattendu
- TypeScript `strict` devrait avertir mais la condition truthy/falsy masque le problème

**Recommandation** :
```typescript
let startTime: number | undefined = undefined

const animate = (timestamp: number) => {
  if (startTime === undefined) startTime = timestamp
  // ...
}
```

**Effort** : 5 min
**Impact** : Bug potentiel

---

### 🟡 MINEUR (3)

#### WEBUI-M01 : console.warn dans json-parse.ts

**Fichier** : `packages/web-ui/src/lib/json-parse.ts`

**Lignes** : 80, 124

**Description** :
Utilisation directe de `console.warn()` au lieu du logger custom :
```typescript
if (!result.success) {
  if (typeof window !== 'undefined') {
    console.warn('JSON array validation failed:', result.error.format())  // ❌
  }
  return []
}
```

**Recommandation** :
```typescript
import { createLogger } from './logger'
const logger = createLogger('json-parse')

// Remplacer console.warn par :
logger.warn('JSON array validation failed', { error: result.error.format() })
```

**Effort** : 10 min
**Impact** : Cohérence logging

---

#### WEBUI-M02 : console.error dans global-error.tsx

**Fichier** : `packages/web-ui/src/app/global-error.tsx`

**Ligne** : 16

**Description** :
```typescript
useEffect(() => {
  console.error('Global application error:', error)  // ❌
}, [error])
```

**Recommandation** :
```typescript
import { createLogger } from '@/lib/logger'
const logger = createLogger('global-error')

useEffect(() => {
  logger.error('Global application error', {
    message: error.message,
    stack: error.stack
  })
}, [error])
```

**Effort** : 5 min
**Impact** : Cohérence logging

---

#### WEBUI-M03 : Duplication formatLastUpdate et typeConfig

**Fichiers** :
- `packages/web-ui/src/components/workflow/RealtimeWorkflowList.tsx` (lignes 14-23)
- `packages/web-ui/src/components/task/DecisionCard.tsx` (lignes 22-51)
- `packages/web-ui/src/components/task/IssueCard.tsx` (lignes 21-50)

**Description** :

1. `formatLastUpdate()` définie localement dans `RealtimeWorkflowList.tsx` au lieu de `lib/date-utils.ts`

2. `categoryConfig` et `typeConfig` définis séparément dans `DecisionCard.tsx` et `IssueCard.tsx` :
```typescript
const categoryConfig: Record<string, { label: string; icon: React.ReactNode }> = {
  ARCHITECTURE: { label: 'Architecture', icon: <Building2 ... /> },
  // ...
}
```

**Recommandation** :
1. Déplacer `formatLastUpdate()` vers `lib/date-utils.ts`
2. Créer `lib/card-configs.ts` pour centraliser les configs de cards

**Effort** : 20 min
**Impact** : DRY

---

## Plan de Correction Suggéré

### Priorité 1 : Critiques (1 item)

| ID | Description | Effort | Package |
|----|-------------|--------|---------|
| SHARED-C01 | Résoudre duplication enums | 30 min | shared |

### Priorité 2 : Importants (3 items)

| ID | Description | Effort | Package |
|----|-------------|--------|---------|
| SHARED-I01 | Retirer .env du git | 5 min | shared |
| MCP-I01 | Git diff throw au lieu de return empty | 15 min | mcp-server |
| WEBUI-I01 | Fixer AnimatedCounter startTime | 5 min | web-ui |

### Priorité 3 : Mineurs (7 items)

| ID | Description | Effort | Package |
|----|-------------|--------|---------|
| SHARED-M01 | Upgrade Zod v5 | 10 min | shared |
| MCP-M01 | Ajouter JSDoc handleToolCall | 5 min | mcp-server |
| MCP-M02 | Extraire helpers ensureTaskExists | 20 min | mcp-server |
| MCP-M03 | Centraliser émission STATS_UPDATED | 15 min | mcp-server |
| WEBUI-M01 | Logger dans json-parse.ts | 10 min | web-ui |
| WEBUI-M02 | Logger dans global-error.tsx | 5 min | web-ui |
| WEBUI-M03 | Centraliser formatLastUpdate et configs | 20 min | web-ui |

---

## Effort Total Estimé

| Priorité | Nombre | Effort |
|----------|--------|--------|
| P1 (Critique) | 1 | 30 min |
| P2 (Important) | 3 | 25 min |
| P3 (Mineur) | 7 | 85 min |
| **TOTAL** | **11** | **140 min (~2h20)** |

---

## Score Attendu Après Corrections

Après résolution de tous les problèmes :

| Package | Score Actuel | Score Attendu |
|---------|--------------|---------------|
| shared | 8.0/10 | 9.0/10 |
| mcp-server | 8.5/10 | 9.0/10 |
| web-ui | 8.2/10 | 9.0/10 |
| **Global** | **8.2/10** | **9.0/10** |

---

**Document généré le** : 2 Décembre 2025
**Auditeur** : Claude Code
