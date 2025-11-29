# Standards de Code

## Conventions de Nommage

### Variables & Fonctions

```typescript
// camelCase
const workflowId = 'clx123'
const isCompleted = true
const startTask = async () => {}
const handleGitDiff = () => {}
```

### Types & Interfaces

```typescript
// PascalCase
interface TaskData {
  id: string
  name: string
}

type SnapshotData = {
  gitHash: string
}
```

### Enums

```typescript
// PascalCase (Prisma génère automatiquement)
enum TaskStatus {
  IN_PROGRESS
  SUCCESS
  PARTIAL_SUCCESS
  FAILED
}

// Usage
const status = TaskStatus.IN_PROGRESS
```

### Constantes

```typescript
// SCREAMING_SNAKE_CASE
const MAX_MILESTONES_PER_TASK = 5
const DEFAULT_STALE_TIME = 5 * 60 * 1000
const MCP_SERVER_VERSION = '1.0.0'
```

### Fichiers

**Composants React (web-ui) :**
```
TreeView.tsx
DiffViewer.tsx
WorkflowCard.tsx
```

**Autres fichiers :**
```
git-snapshot.ts
scope-verify.ts
start-workflow.ts
auth.middleware.ts
```

**Dossiers :**
```
tools/
utils/
components/
```

---

## TypeScript

### Configuration (tsconfig.json)

```json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "esModuleInterop": true,
    "skipLibCheck": true
  }
}
```

### Règles

**✅ FAIRE :**

```typescript
// Types explicites pour fonctions publiques
export async function handleStartTask(
  args: StartTaskArgs
): Promise<StartTaskResult> {
  // ...
}

// Interfaces pour structures complexes
interface GitDiffResult {
  added: string[]
  modified: string[]
  deleted: string[]
}

// Enums Prisma (importés)
import { TaskStatus, DecisionCategory } from '@prisma/client'
```

**❌ ÉVITER :**

```typescript
// any (utiliser unknown si vraiment nécessaire)
const data: any = {}

// Types implicites pour APIs publiques
export function startWorkflow(args) {  // ❌ Type de args ?
  // ...
}

// @ts-ignore (sauf exception TRÈS justifiée + commentaire)
// @ts-ignore
const value = someComplexThing()
```

---

## Structure de Fichiers

### MCP Tool Handler

```typescript
// packages/mcp-server/src/tools/start-task.ts

import { prisma } from '../db'
import { createGitSnapshot } from '../utils/git-snapshot'
import type { StartTaskArgs, StartTaskResult } from '../types'
import { TaskStatus } from '@prisma/client'

export async function handleStartTask(
  args: StartTaskArgs
): Promise<StartTaskResult> {
  // 1. Valider les arguments (Zod si nécessaire)

  // 2. Créer snapshot Git
  const snapshot = await createGitSnapshot()

  // 3. Créer task en DB
  const task = await prisma.task.create({
    data: {
      workflowId: args.workflow_id,
      parentTaskId: args.parent_task_id,
      name: args.name,
      goal: args.goal,
      areas: args.areas || [],
      snapshotType: snapshot.type,
      snapshotData: snapshot.data,
      status: TaskStatus.IN_PROGRESS
    }
  })

  // 4. Retourner résultat
  return {
    task_id: task.id,
    snapshot_id: snapshot.id,
    snapshot_type: snapshot.type,
    started_at: task.startedAt
  }
}
```

**Structure :**
1. Imports (types en dernier)
2. Export fonction async
3. Validation
4. Logique métier
5. Retour résultat

### Utilitaire Git

```typescript
// packages/mcp-server/src/utils/git-snapshot.ts

import simpleGit from 'simple-git'

export interface GitSnapshotResult {
  type: 'git' | 'checksum'
  id: string
  data: object
}

export async function createGitSnapshot(): Promise<GitSnapshotResult> {
  const git = simpleGit()
  const isGitRepo = await git.checkIsRepo()

  if (isGitRepo) {
    const hash = await git.revparse(['HEAD'])
    return {
      type: 'git',
      id: hash.trim(),
      data: { gitHash: hash.trim() }
    }
  }

  // Fallback checksum
  const checksums = await createChecksumSnapshot()
  return {
    type: 'checksum',
    id: Date.now().toString(),
    data: { checksums }
  }
}

async function createChecksumSnapshot() {
  // Implementation...
}
```

**Règles :**
- ✅ Export interfaces publiques
- ✅ Fonctions privées sans export
- ✅ Documentation JSDoc si logique complexe

---

## Git

### Commits (Conventional Commits)

**Format :**
```
type(scope): description

[optional body]
```

**Types :**
- `feat` : Nouvelle feature
- `fix` : Bug fix
- `refactor` : Refactoring (pas de changement fonctionnel)
- `docs` : Documentation
- `test` : Tests
- `chore` : Tâches (config, dependencies, etc.)

**Exemples :**
```bash
feat(mcp): add complete_task tool with Git diff
fix(git): handle union of commits + working tree
refactor(db): extract Prisma singleton to db.ts
docs(readme): update installation instructions
chore(deps): upgrade @modelcontextprotocol/sdk to 1.2.0
```

**Scopes courants :**
- Tools MCP : `mcp`, `tools`
- Utils : `git`, `checksum`, `scope`
- Database : `db`, `prisma`
- UI : `ui`, `components`
- Infra : `docker`, `ci`

### Branches

**Stratégie :**
- `main` : Production (toujours stable)
- `feature/feature-name` : Nouvelles features
- `fix/bug-description` : Bug fixes

**Workflow :**
```bash
# Créer branche
git checkout -b feature/web-ui

# Commits
git add .
git commit -m "feat(ui): add TreeView component"

# Merge vers main
git checkout main
git merge feature/web-ui
```

---

## Validation (Zod)

Toutes les entrées utilisateur DOIVENT être validées.

### Exemple MCP Tool

```typescript
import { z } from 'zod'

const startWorkflowSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  plan: z.array(
    z.object({
      step: z.string(),
      goal: z.string()
    })
  ).optional()
})

export async function handleStartWorkflow(args: unknown) {
  // Validation
  const validated = startWorkflowSchema.parse(args)

  // Logique métier (validated est type-safe)
  const workflow = await prisma.workflow.create({
    data: validated
  })

  return { workflow_id: workflow.id }
}
```

---

## Gestion d'Erreurs

### Custom Errors

```typescript
// mcp-server/src/utils/errors.ts

export class McpError extends Error {
  constructor(
    public message: string,
    public code: string = 'INTERNAL_ERROR'
  ) {
    super(message)
    this.name = 'McpError'
  }
}

export class ValidationError extends McpError {
  constructor(message: string) {
    super(message, 'VALIDATION_ERROR')
  }
}

export class GitError extends McpError {
  constructor(message: string) {
    super(message, 'GIT_ERROR')
  }
}
```

### Usage

```typescript
// tools/complete-task.ts

import { ValidationError, GitError } from '../utils/errors'

export async function handleCompleteTask(args: CompleteTaskArgs) {
  const task = await prisma.task.findUnique({ where: { id: args.task_id } })

  if (!task) {
    throw new ValidationError('Task not found')
  }

  if (task.snapshotType === 'git') {
    try {
      const diff = await computeGitDiff(task)
    } catch (err) {
      throw new GitError(`Failed to compute Git diff: ${err.message}`)
    }
  }
}
```

---

## Prisma

### Règles

**✅ Utiliser :**

```typescript
// Singleton pattern
import { prisma } from './db'

// Include pour relations
const workflow = await prisma.workflow.findUnique({
  where: { id: workflowId },
  include: {
    tasks: {
      include: { decisions: true, issues: true }
    }
  }
})

// Promise.all pour requêtes parallèles
const [workflows, totalCount] = await Promise.all([
  prisma.workflow.findMany(),
  prisma.workflow.count()
])
```

**❌ Éviter :**

```typescript
// Multiples instances Prisma
const prisma = new PrismaClient()  // ❌ À chaque appel

// N+1 queries
const tasks = await prisma.task.findMany()
for (const task of tasks) {
  task.decisions = await prisma.decision.findMany({ where: { taskId: task.id } })
}

// Raw SQL (sauf cas exceptionnel)
await prisma.$queryRaw`SELECT * FROM tasks WHERE id = ${id}`
```

---

## Tests (Phase 2)

### Structure

```
packages/mcp-server/
├── src/
│   └── tools/
│       └── start-task.ts
└── tests/
    ├── tools/
    │   └── start-task.test.ts
    └── utils/
        └── git-snapshot.test.ts
```

### Exemple Test (Vitest)

```typescript
// tests/tools/start-task.test.ts

import { describe, it, expect, beforeEach } from 'vitest'
import { handleStartTask } from '../../src/tools/start-task'
import { prisma } from '../../src/db'

describe('start_task', () => {
  beforeEach(async () => {
    // Clean DB
    await prisma.task.deleteMany()
  })

  it('should create task with Git snapshot', async () => {
    const workflow = await prisma.workflow.create({
      data: { name: 'Test Workflow' }
    })

    const result = await handleStartTask({
      workflow_id: workflow.id,
      name: 'Test Task',
      goal: 'Test goal'
    })

    expect(result.task_id).toBeDefined()
    expect(result.snapshot_type).toBe('git')

    const task = await prisma.task.findUnique({
      where: { id: result.task_id }
    })

    expect(task).toBeDefined()
    expect(task?.snapshotType).toBe('git')
  })
})
```

---

## Sécurité

### Secrets

**❌ JAMAIS :**

```typescript
// Hardcoder secrets
const DATABASE_URL = 'postgresql://user:password@localhost/db'
```

**✅ TOUJOURS :**

```typescript
// Variables d'environnement
const DATABASE_URL = process.env.DATABASE_URL

if (!DATABASE_URL) {
  throw new Error('DATABASE_URL is required')
}
```

### Validation Stricte

Toutes les entrées MCP passent par Zod.

### Isolation Filesystem

Le MCP server ne peut accéder qu'au répertoire Git du projet.

---

## Performance

### Database Indexes

Les indexes sont déjà définis dans le schéma Prisma :

```prisma
model Task {
  @@index([workflowId])
  @@index([status])
  @@index([startedAt])
}
```

### Connection Pooling

Prisma gère automatiquement le pooling :

```typescript
// db.ts (singleton)
const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error'] : ['error']
})
```

### Optimisation Git Diff

Cache le résultat du Git diff pour éviter recalculs :

```typescript
// complete-task.ts
const diffCache = new Map<string, GitDiffResult>()

export async function computeGitDiff(task: Task): Promise<GitDiffResult> {
  const cacheKey = `${task.id}-${task.snapshotData.gitHash}`

  if (diffCache.has(cacheKey)) {
    return diffCache.get(cacheKey)!
  }

  const result = await performGitDiff(task)
  diffCache.set(cacheKey, result)

  return result
}
```

---

## Monorepo (pnpm)

### Scripts Workspace

```json
// package.json (root)
{
  "scripts": {
    "dev:mcp": "pnpm --filter mcp-server dev",
    "dev:ui": "pnpm --filter web-ui dev",
    "build:all": "pnpm --filter shared build && pnpm --filter mcp-server build",
    "db:migrate": "pnpm --filter shared prisma migrate dev",
    "db:generate": "pnpm --filter shared prisma generate"
  }
}
```

### Dépendances Workspace

```json
// packages/mcp-server/package.json
{
  "dependencies": {
    "@mcp-tracker/shared": "workspace:*"
  }
}
```

---

## Documentation Code

### JSDoc pour Fonctions Publiques

```typescript
/**
 * Create a Git snapshot of the current repository state.
 *
 * Falls back to checksum-based snapshot if not a Git repository.
 *
 * @returns Snapshot data with type and hash/checksums
 * @throws {GitError} If Git command fails
 */
export async function createGitSnapshot(): Promise<GitSnapshotResult> {
  // ...
}
```

### Commentaires Inline

```typescript
// ❌ ÉVITER (commentaire inutile)
// Incrémente le compteur
count++

// ✅ BON (explique le pourquoi)
// Union des diffs commits + working tree pour capturer TOUS les changements
const allChanges = [...committedChanges, ...workingTreeChanges]
```

---

## Checklist Code Review

Avant chaque commit, vérifier :

**Architecture :**
- [ ] Package correct (shared, mcp-server, web-ui) ?
- [ ] Pas d'imports circulaires ?
- [ ] Code partagé dans `shared/` ou `utils/` ?

**TypeScript :**
- [ ] Mode strict respecté ?
- [ ] Pas de `any` ?
- [ ] Types explicites pour APIs publiques ?

**Database :**
- [ ] Utilisation du singleton Prisma ?
- [ ] Indexes appropriés ?
- [ ] Relations cascade delete correctes ?

**MCP :**
- [ ] Validation Zod des arguments ?
- [ ] Retour structuré (object avec fields nommés) ?
- [ ] Erreurs custom avec messages clairs ?

**Git :**
- [ ] Conventional commit message ?
- [ ] Scope approprié ?

**Sécurité :**
- [ ] Pas de secrets hardcodés ?
- [ ] Validation stricte des entrées ?

---

**Ce document définit les standards de code.**
Pour l'architecture globale, voir :
- [Architecture](./architecture.md) : Structure du projet
- [MCP Protocol](./mcp-protocol.md) : Spécifications MCP
- [Database](./database.md) : Schéma Prisma
