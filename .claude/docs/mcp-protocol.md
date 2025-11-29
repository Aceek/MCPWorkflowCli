# MCP Protocol

## Vue d'ensemble

Le MCP expose **6 tools** pour tracker un workflow agentique de manière structurée et non intrusive.

| Tool | Rôle | Fréquence | Phase |
|------|------|-----------|-------|
| `start_workflow` | Initialise un workflow | 1x par workflow | Obligatoire |
| `start_task` | Démarre une task + snapshot Git | 1x par task/subtask | Obligatoire |
| `log_decision` | Log une décision architecturale | 0-3x par task | Optionnel |
| `log_issue` | Log un problème rencontré | 0-3x par task | Optionnel |
| `log_milestone` | Update temps réel pour l'UI | 0-5x par task | Optionnel |
| `complete_task` | Finalise task + calcule diffs | 1x par task | Obligatoire |

**Promesse :** Max 3-6 appels MCP par task → pas de flood de contexte.

---

## 1. start_workflow

**Rôle :** Initialise un nouveau workflow (container de haut niveau).

### Input Schema

```json
{
  "name": "start_workflow",
  "description": "Initialize a new workflow tracking session",
  "inputSchema": {
    "type": "object",
    "properties": {
      "name": {
        "type": "string",
        "description": "Short workflow name (e.g., 'Auth system refactor')"
      },
      "description": {
        "type": "string",
        "description": "Detailed description of the workflow goal"
      },
      "plan": {
        "type": "array",
        "description": "Optional implementation plan as steps",
        "items": {
          "type": "object",
          "properties": {
            "step": {"type": "string"},
            "goal": {"type": "string"}
          },
          "required": ["step", "goal"]
        }
      }
    },
    "required": ["name"]
  }
}
```

### Output

```json
{
  "workflow_id": "clx123abc",
  "created_at": "2025-01-15T10:00:00Z"
}
```

### Exemple d'Appel

```typescript
const result = await mcpClient.call('start_workflow', {
  name: 'Migration NextAuth v5',
  description: 'Migrer de NextAuth v4 vers v5 avec nouveaux callbacks',
  plan: [
    { step: '1', goal: 'Installer NextAuth v5' },
    { step: '2', goal: 'Configurer routes API' },
    { step: '3', goal: 'Migrer callbacks' }
  ]
})

// result.workflow_id = "clx123abc"
```

---

## 2. start_task

**Rôle :** Démarre une task (ou subtask). Crée un **snapshot Git** de l'état actuel.

### Input Schema

```json
{
  "name": "start_task",
  "description": "Start a new task and create a Git snapshot",
  "inputSchema": {
    "type": "object",
    "properties": {
      "workflow_id": {
        "type": "string",
        "description": "Parent workflow ID"
      },
      "parent_task_id": {
        "type": "string",
        "description": "Parent task ID (null if top-level task)"
      },
      "name": {
        "type": "string",
        "description": "Task name (e.g., 'Implement Stripe integration')"
      },
      "goal": {
        "type": "string",
        "description": "Precise goal of this task"
      },
      "areas": {
        "type": "array",
        "items": {"type": "string"},
        "description": "Code areas this task will touch (e.g., ['auth', 'api'])"
      }
    },
    "required": ["workflow_id", "name", "goal"]
  }
}
```

### Output

```json
{
  "task_id": "clx456def",
  "snapshot_id": "abc123git",
  "snapshot_type": "git",
  "started_at": "2025-01-15T10:05:00Z"
}
```

### Logique Git Snapshot (CRITIQUE)

**Au `start_task`, le MCP :**

1. Vérifie si le projet est un repo Git
2. **Si Git :** Stocke le hash du commit actuel
3. **Si pas Git :** Créé un snapshot basé sur checksums MD5

```typescript
// Implémentation simplifiée
import simpleGit from 'simple-git'

const git = simpleGit()
const isGitRepo = await git.checkIsRepo()

if (isGitRepo) {
  // Git-based snapshot
  const currentHash = await git.revparse(['HEAD'])
  snapshotType = 'git'
  snapshotData = { gitHash: currentHash.trim() }
} else {
  // Fallback: Checksum snapshot
  snapshotType = 'checksum'
  snapshotData = { checksums: await createChecksumSnapshot() }
}
```

**Pourquoi c'est critique ?**
- Capture l'état EXACT avant modification
- Permet le calcul des diffs au `complete_task`
- Fonctionne même sans Git (fallback)

---

## 3. log_decision

**Rôle :** Logger une décision architecturale importante (optionnel).

### Input Schema

```json
{
  "name": "log_decision",
  "description": "Log an important architectural decision",
  "inputSchema": {
    "type": "object",
    "properties": {
      "task_id": {"type": "string"},
      "category": {
        "type": "string",
        "enum": ["architecture", "library_choice", "trade_off", "workaround", "other"]
      },
      "question": {
        "type": "string",
        "description": "The decision question (e.g., 'Which auth library to use?')"
      },
      "options_considered": {
        "type": "array",
        "items": {"type": "string"},
        "description": "Options evaluated (e.g., ['NextAuth', 'Clerk', 'Custom'])"
      },
      "chosen": {
        "type": "string",
        "description": "Chosen option"
      },
      "reasoning": {
        "type": "string",
        "description": "Why this choice (1-2 sentences)"
      },
      "trade_offs": {
        "type": "string",
        "description": "Accepted compromises (optional)"
      }
    },
    "required": ["task_id", "category", "question", "chosen", "reasoning"]
  }
}
```

### Exemple d'Appel

```typescript
await mcpClient.call('log_decision', {
  task_id: 'clx456def',
  category: 'library_choice',
  question: 'Quelle librairie de validation utiliser ?',
  options_considered: ['Zod', 'Yup', 'Joi'],
  chosen: 'Zod',
  reasoning: 'Meilleur typage TypeScript natif et intégration avec tRPC',
  trade_offs: 'Moins de plugins que Joi mais performances meilleures'
})
```

**Quand l'utiliser ?**
- Choix de librairie important
- Décision d'architecture
- Trade-off significatif
- Workaround technique

**Quand NE PAS l'utiliser ?**
- Décisions triviales (ex: nommage de variable)
- Choix évidents sans alternative

---

## 4. log_issue

**Rôle :** Logger un problème rencontré pendant l'exécution (optionnel).

### Input Schema

```json
{
  "name": "log_issue",
  "description": "Log an issue encountered during execution",
  "inputSchema": {
    "type": "object",
    "properties": {
      "task_id": {"type": "string"},
      "type": {
        "type": "string",
        "enum": ["documentation_gap", "bug_encountered", "dependency_conflict", "unclear_requirement", "other"]
      },
      "description": {
        "type": "string",
        "description": "Description of the issue"
      },
      "resolution": {
        "type": "string",
        "description": "How the issue was resolved/worked around"
      },
      "requires_human_review": {
        "type": "boolean",
        "description": "Does a human need to review this resolution?"
      }
    },
    "required": ["task_id", "type", "description", "resolution"]
  }
}
```

### Exemple d'Appel

```typescript
await mcpClient.call('log_issue', {
  task_id: 'clx456def',
  type: 'documentation_gap',
  description: 'La doc NextAuth v5 sur les callbacks est obsolète',
  resolution: 'J\'ai utilisé les exemples GitHub officiels du repo',
  requires_human_review: false
})
```

**Types d'issues :**
- `documentation_gap` : Doc manquante/obsolète
- `bug_encountered` : Bug dans une librairie
- `dependency_conflict` : Conflit de versions
- `unclear_requirement` : Spécification floue
- `other` : Autre problème

---

## 5. log_milestone

**Rôle :** Update temps réel pour l'UI (léger, fire-and-forget).

### Input Schema

```json
{
  "name": "log_milestone",
  "description": "Log a milestone for real-time UI updates",
  "inputSchema": {
    "type": "object",
    "properties": {
      "task_id": {"type": "string"},
      "message": {
        "type": "string",
        "description": "Short message (e.g., 'Running tests...')"
      },
      "progress": {
        "type": "number",
        "description": "Estimated progress (0-100)",
        "minimum": 0,
        "maximum": 100
      },
      "metadata": {
        "type": "object",
        "description": "Optional additional data"
      }
    },
    "required": ["task_id", "message"]
  }
}
```

### Exemple d'Appel

```typescript
// Au début
await mcpClient.call('log_milestone', {
  task_id: 'clx456def',
  message: 'Installing dependencies...',
  progress: 25
})

// Milieu
await mcpClient.call('log_milestone', {
  task_id: 'clx456def',
  message: 'Running tests...',
  progress: 75,
  metadata: { test_suite: 'auth' }
})

// Fin
await mcpClient.call('log_milestone', {
  task_id: 'clx456def',
  message: 'Build successful',
  progress: 100
})
```

**Best practices :**
- Max 5 milestones par task
- Messages courts et informatifs
- Progress optionnel (utile pour barre de progression UI)

---

## 6. complete_task (LE PLUS CRITIQUE)

**Rôle :** Finalise une task. Calcule automatiquement les fichiers modifiés via **Git diff robuste**.

### Input Schema

```json
{
  "name": "complete_task",
  "description": "Complete a task and compute file changes via Git diff",
  "inputSchema": {
    "type": "object",
    "properties": {
      "task_id": {"type": "string"},
      "status": {
        "type": "string",
        "enum": ["success", "partial_success", "failed"]
      },
      "outcome": {
        "type": "object",
        "properties": {
          "summary": {
            "type": "string",
            "description": "Summary of what was accomplished (2-4 sentences)"
          },
          "achievements": {
            "type": "array",
            "items": {"type": "string"},
            "description": "Concrete achievements (empty array if none)"
          },
          "limitations": {
            "type": "array",
            "items": {"type": "string"},
            "description": "Limitations/compromises (empty array if none)"
          },
          "manual_review_needed": {
            "type": "boolean",
            "description": "Does a human need to review before continuing?"
          },
          "manual_review_reason": {
            "type": "string",
            "description": "Why manual review is needed"
          },
          "next_steps": {
            "type": "array",
            "items": {"type": "string"},
            "description": "Suggested next steps (optional)"
          }
        },
        "required": ["summary"]
      },
      "metadata": {
        "type": "object",
        "properties": {
          "packages_added": {"type": "array", "items": {"type": "string"}},
          "packages_removed": {"type": "array", "items": {"type": "string"}},
          "commands_executed": {"type": "array", "items": {"type": "string"}},
          "tests_status": {
            "type": "string",
            "enum": ["passed", "failed", "not_run"]
          }
        }
      }
    },
    "required": ["task_id", "status", "outcome"]
  }
}
```

### Output

```json
{
  "task_id": "clx456def",
  "duration_seconds": 1247,
  "files_changed": {
    "added": ["src/auth/config.ts", "src/middleware.ts"],
    "modified": ["package.json", "prisma/schema.prisma"],
    "deleted": ["src/utils/old-jwt.ts"]
  },
  "verification": {
    "scope_match": true,
    "unexpected_files": [],
    "warnings": []
  }
}
```

### Logique Git Diff Robuste (CRITIQUE)

**Le MCP calcule automatiquement les fichiers modifiés en faisant l'UNION de 2 diffs :**

```typescript
// Au complete_task

const task = await prisma.task.findUnique({ where: { id: task_id } })
const startHash = task.snapshotData.gitHash  // Hash du start_task

// ========================================
// DIFF 1 : Commits effectués pendant la task
// git diff <start_hash> HEAD --name-status
// ========================================
const committedDiff = await git.diff([
  startHash,
  'HEAD',
  '--name-status'
])

// ========================================
// DIFF 2 : Working tree non commité
// git diff HEAD --name-status
// ========================================
const workingTreeDiff = await git.diff([
  'HEAD',
  '--name-status'
])

// ========================================
// UNION des deux diffs = VÉRITÉ ABSOLUE
// ========================================
const allChanges = parseDiffOutput(committedDiff)
                    .concat(parseDiffOutput(workingTreeDiff))

// Dédupliquer et catégoriser
const changesMap = new Map()
for (const change of allChanges) {
  changesMap.set(change.file, change.status)  // A, M, D
}
```

**Exemple concret :**

```
10:00 → start_task (snapshot: abc123)
10:05 → Agent modifie auth.ts, database.ts
10:10 → Agent commit → nouveau hash def456
10:15 → Agent modifie config.ts (non commité)
10:20 → complete_task

Diff 1 (abc123..def456) : auth.ts, database.ts
Diff 2 (def456..HEAD)   : config.ts
Union                   : auth.ts, database.ts, config.ts ✅
```

**Pourquoi c'est critique ?**
- Capture TOUS les changements (committés + non committés)
- Évite de perdre des modifications en cours
- Fournit la vérité absolue sur le travail de l'agent

### Vérification de Scope

Le MCP vérifie si les fichiers modifiés correspondent aux `areas` déclarées au `start_task`.

```typescript
// start_task
await mcpClient.call('start_task', {
  workflow_id: 'clx123',
  name: 'Implement auth',
  goal: 'Add authentication system',
  areas: ['auth', 'api']  // ← Scope déclaré
})

// complete_task
// Le MCP détecte : auth.ts, api.ts, utils.ts
// → utils.ts hors scope !

// Output
{
  verification: {
    scope_match: false,
    unexpected_files: ['utils.ts'],
    warnings: [
      '⚠️ 1 file(s) modified outside declared scope (auth, api)'
    ]
  }
}
```

**Utilité :**
- Détection de side effects involontaires
- Alerte l'humain si modifications hors scope
- Améliore la qualité du suivi

---

## Flow Typique d'Utilisation

### Workflow Simple (1 Task)

```typescript
// 1. Initialiser workflow
const { workflow_id } = await mcpClient.call('start_workflow', {
  name: 'Add authentication',
  description: 'Implement JWT-based authentication'
})

// 2. Démarrer task
const { task_id } = await mcpClient.call('start_task', {
  workflow_id,
  name: 'Setup JWT middleware',
  goal: 'Create middleware to verify JWT tokens',
  areas: ['auth', 'middleware']
})

// 3. (Optionnel) Logger une décision
await mcpClient.call('log_decision', {
  task_id,
  category: 'library_choice',
  question: 'Quelle librairie JWT ?',
  options_considered: ['jsonwebtoken', 'jose'],
  chosen: 'jsonwebtoken',
  reasoning: 'Plus mature et documenté'
})

// 4. (Optionnel) Updates temps réel
await mcpClient.call('log_milestone', {
  task_id,
  message: 'Installing jsonwebtoken...',
  progress: 50
})

// 5. Finaliser task
await mcpClient.call('complete_task', {
  task_id,
  status: 'success',
  outcome: {
    summary: 'JWT middleware créé et testé avec succès',
    achievements: [
      'Middleware vérifie signature JWT',
      'Tests passent (100% coverage)'
    ],
    limitations: [
      'Refresh tokens non implémentés (feature future)'
    ]
  },
  metadata: {
    packages_added: ['jsonwebtoken', '@types/jsonwebtoken'],
    commands_executed: ['npm install jsonwebtoken', 'npm test'],
    tests_status: 'passed'
  }
})

// → MCP retourne automatiquement :
// - Durée : 847 secondes
// - Fichiers modifiés : package.json, src/middleware/auth.ts, tests/auth.test.ts
// - Vérification scope : ✅ Tous les fichiers dans scope
```

### Workflow Hiérarchique (Task + Subtask)

```typescript
// 1. Workflow
const { workflow_id } = await mcpClient.call('start_workflow', {
  name: 'Full auth system'
})

// 2. Task principale
const { task_id: mainTaskId } = await mcpClient.call('start_task', {
  workflow_id,
  name: 'Implement authentication'
})

// 3. Subtask 1
const { task_id: subtask1Id } = await mcpClient.call('start_task', {
  workflow_id,
  parent_task_id: mainTaskId,  // ← Lien hiérarchique
  name: 'Setup JWT middleware'
})

await mcpClient.call('complete_task', { task_id: subtask1Id, ... })

// 4. Subtask 2
const { task_id: subtask2Id } = await mcpClient.call('start_task', {
  workflow_id,
  parent_task_id: mainTaskId,
  name: 'Create login route'
})

await mcpClient.call('complete_task', { task_id: subtask2Id, ... })

// 5. Finaliser task principale
await mcpClient.call('complete_task', { task_id: mainTaskId, ... })
```

---

## Enums et Type Safety

Le MCP valide strictement les enums pour éviter les typos.

### Enums Task Status

```typescript
// Input complete_task
status: "success" | "partial_success" | "failed"

// Stocké en DB (Prisma enum)
enum TaskStatus {
  SUCCESS
  PARTIAL_SUCCESS
  FAILED
}
```

### Enums Decision Category

```typescript
// Input log_decision
category: "architecture" | "library_choice" | "trade_off" | "workaround" | "other"

// Stocké en DB
enum DecisionCategory {
  ARCHITECTURE
  LIBRARY_CHOICE
  TRADE_OFF
  WORKAROUND
  OTHER
}
```

### Enums Issue Type

```typescript
// Input log_issue
type: "documentation_gap" | "bug_encountered" | "dependency_conflict" | "unclear_requirement" | "other"

// Stocké en DB
enum IssueType {
  DOC_GAP
  BUG
  DEPENDENCY_CONFLICT
  UNCLEAR_REQUIREMENT
  OTHER
}
```

---

## Prompts Système Suggérés

Pour que les agents utilisent correctement le MCP, ajoutez dans `.claude/prompts/system.md` :

```markdown
## Workflow Tracking MCP

Vous avez accès à un MCP de tracking des workflows. Utilisez-le pour documenter votre travail :

1. **Au début de votre mission** : Appelez `start_task`
2. **Si vous prenez une décision architecturale importante** : Appelez `log_decision`
3. **Si vous rencontrez un problème** : Appelez `log_issue`
4. **Pour update l'UI en temps réel** : Appelez `log_milestone` (max 5 fois)
5. **À la fin de votre mission** : Appelez `complete_task` avec un résumé structuré

**Important** :
- Ne logguez que les décisions/problèmes avec une réelle valeur ajoutée
- Les tableaux `achievements` et `limitations` peuvent être vides si rien de notable
- Le MCP calcule automatiquement les fichiers modifiés (via Git diff)
```

---

**Ce document définit le protocole MCP complet.**
Pour détails sur l'implémentation, voir :
- [Architecture](./architecture.md) : Structure du projet
- [Database](./database.md) : Schéma Prisma
