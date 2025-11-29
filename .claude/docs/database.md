# Database Schema

## Vue d'ensemble

Le schéma utilise **Prisma ORM** pour supporter **deux bases de données** :
- **PostgreSQL** (recommandé pour Phase 1)
- **SQLite** (pour distribution standalone future)

---

## Schéma Prisma Complet

```prisma
// packages/shared/prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = env("DATABASE_PROVIDER") // "postgresql" ou "sqlite"
  url      = env("DATABASE_URL")
}

// ============================================
// ENUMS (Type Safety)
// ============================================

enum WorkflowStatus {
  IN_PROGRESS
  COMPLETED
  FAILED
}

enum TaskStatus {
  IN_PROGRESS
  SUCCESS
  PARTIAL_SUCCESS
  FAILED
}

enum DecisionCategory {
  ARCHITECTURE
  LIBRARY_CHOICE
  TRADE_OFF
  WORKAROUND
  OTHER
}

enum IssueType {
  DOC_GAP
  BUG
  DEPENDENCY_CONFLICT
  UNCLEAR_REQUIREMENT
  OTHER
}

enum TestsStatus {
  PASSED
  FAILED
  NOT_RUN
}

// ============================================
// MODELS
// ============================================

model Workflow {
  id          String         @id @default(cuid())
  name        String
  description String?        @db.Text
  plan        Json?          // Structure libre (array d'étapes)
  status      WorkflowStatus @default(IN_PROGRESS)
  createdAt   DateTime       @default(now())
  updatedAt   DateTime       @updatedAt

  tasks       Task[]

  @@index([status])
  @@index([createdAt])
}

model Task {
  id            String      @id @default(cuid())
  workflowId    String
  parentTaskId  String?
  name          String
  goal          String      @db.Text
  status        TaskStatus  @default(IN_PROGRESS)

  // Scope (indication de zone, ex: ["auth", "api"])
  areas         String[]

  // Snapshot data (Git ou Checksum)
  snapshotId    String?
  snapshotType  String?     // "git" ou "checksum"
  snapshotData  Json?       // { gitHash: "abc123" } ou { checksums: {...} }

  // Timing (calculé automatiquement par le MCP)
  startedAt     DateTime    @default(now())
  completedAt   DateTime?
  durationMs    Int?

  // Outcome (fourni par l'agent dans complete_task)
  summary       String?     @db.Text
  achievements  String[]    // Peut être vide []
  limitations   String[]    // Peut être vide []
  manualReviewNeeded Boolean @default(false)
  manualReviewReason String? @db.Text
  nextSteps     String[]

  // Metadata (fourni par l'agent)
  packagesAdded    String[]
  packagesRemoved  String[]
  commandsExecuted String[]
  testsStatus      TestsStatus?

  // Files changed (calculé par le MCP via Git diff)
  filesAdded       String[]
  filesModified    String[]
  filesDeleted     String[]

  // Verification (calculé par le MCP)
  scopeMatch       Boolean?
  unexpectedFiles  String[]
  warnings         String[]

  // Relations
  workflow      Workflow   @relation(fields: [workflowId], references: [id], onDelete: Cascade)
  parentTask    Task?      @relation("TaskHierarchy", fields: [parentTaskId], references: [id])
  subtasks      Task[]     @relation("TaskHierarchy")
  decisions     Decision[]
  issues        Issue[]
  milestones    Milestone[]

  @@index([workflowId])
  @@index([parentTaskId])
  @@index([status])
  @@index([startedAt])
}

model Decision {
  id                  String           @id @default(cuid())
  taskId              String
  category            DecisionCategory
  question            String           @db.Text
  optionsConsidered   String[]
  chosen              String
  reasoning           String           @db.Text
  tradeOffs           String?          @db.Text
  createdAt           DateTime         @default(now())

  task                Task             @relation(fields: [taskId], references: [id], onDelete: Cascade)

  @@index([taskId])
  @@index([createdAt])
}

model Issue {
  id                   String    @id @default(cuid())
  taskId               String
  type                 IssueType
  description          String    @db.Text
  resolution           String    @db.Text
  requiresHumanReview  Boolean   @default(false)
  createdAt            DateTime  @default(now())

  task                 Task      @relation(fields: [taskId], references: [id], onDelete: Cascade)

  @@index([taskId])
  @@index([createdAt])
}

model Milestone {
  id        String   @id @default(cuid())
  taskId    String
  message   String
  progress  Int?     // 0-100 (optionnel)
  metadata  Json?    // Structure libre
  createdAt DateTime @default(now())

  task      Task     @relation(fields: [taskId], references: [id], onDelete: Cascade)

  @@index([taskId])
  @@index([createdAt])
}
```

---

## Support Multi-DB (PostgreSQL / SQLite)

### Configuration

Le schéma supporte **deux bases de données** via des variables d'environnement.

#### PostgreSQL (Recommandé pour Phase 1)

```bash
# packages/shared/.env
DATABASE_PROVIDER="postgresql"
DATABASE_URL="postgresql://user:password@localhost:5432/mcp_tracker?schema=public"
```

**Avantages :**
- ✅ Support natif des enums (type safety DB)
- ✅ Performance optimale pour gros volumes
- ✅ Transactions robustes (ACID)
- ✅ Indexes avancés
- ✅ Relations complexes

**Cas d'usage :** Développement local, production, Docker

#### SQLite (Support futur - Distribution standalone)

```bash
# packages/shared/.env
DATABASE_PROVIDER="sqlite"
DATABASE_URL="file:./dev.db"
```

**Avantages :**
- ✅ Pas de serveur DB à installer
- ✅ Fichier unique portable
- ✅ Idéal pour distribution npm/binaire

**Limitations :**
- ⚠️ Pas d'enums natifs (Prisma les émule avec des strings + validation)
- ⚠️ Moins performant sur gros volumes
- ⚠️ Pas de support `@db.Text` (converti en `TEXT`)

**Cas d'usage :** Distribution standalone, dev sans Docker

### Gestion des Enums avec SQLite

Prisma gère automatiquement la conversion des enums pour SQLite :

- **PostgreSQL** : Les enums sont créés comme types DB natifs (`CREATE TYPE`)
- **SQLite** : Les enums deviennent des `TEXT` avec validation Prisma côté app

**Type safety TypeScript conservé** dans les deux cas grâce au client Prisma généré.

**Exemple :**
```typescript
// Fonctionne identiquement avec PostgreSQL ou SQLite
await prisma.task.create({
  data: {
    status: TaskStatus.IN_PROGRESS, // ✅ Type safe
    // status: "in_progress" // ❌ Erreur TypeScript
  }
})
```

### Recommandation

**Phase 1 (Développement)** : Utilisez PostgreSQL
**Phase 2 (Distribution)** : Support SQLite sera ajouté pour faciliter le partage

Le code du MCP Server est architecturé pour supporter les deux sans modification.

---

## Explications des Modèles

### Workflow

**Rôle :** Container de haut niveau pour tout le workflow.

**Champs clés :**
- `name` : Nom court du workflow (ex: "Migration NextAuth")
- `description` : Description détaillée (optionnel)
- `plan` : JSON libre (ex: `[{step: "1", goal: "Setup auth"}, ...]`)
- `status` : Enum strict (IN_PROGRESS, COMPLETED, FAILED)

**Exemple :**
```typescript
const workflow = await prisma.workflow.create({
  data: {
    name: 'Auth System Refactor',
    description: 'Migrate from custom JWT to NextAuth v5',
    plan: [
      { step: '1', goal: 'Install NextAuth' },
      { step: '2', goal: 'Configure callbacks' }
    ],
    status: WorkflowStatus.IN_PROGRESS
  }
})
```

---

### Task

**Rôle :** Unité de travail (peut avoir des subtasks via `parentTaskId`).

#### Section : Scope & Snapshot

- **`areas`** : Zones du code (ex: `["auth", "database"]`)
  - Aide à la vérification croisée
  - Détection de modifications hors scope

- **`snapshotData`** : État du code au démarrage
  - Si Git : `{gitHash: "abc123"}`
  - Si Checksum : `{checksums: {"src/auth.ts": "md5hash", ...}}`

**Exemple :**
```typescript
const task = await prisma.task.create({
  data: {
    workflowId: 'clx123',
    name: 'Implement JWT middleware',
    goal: 'Create middleware to verify JWT tokens',
    areas: ['auth', 'middleware'],
    snapshotType: 'git',
    snapshotData: { gitHash: 'abc123' }
  }
})
```

#### Section : Timing

- **`startedAt`** : Auto-généré au `start_task`
- **`completedAt`** : Auto-généré au `complete_task`
- **`durationMs`** : Calculé automatiquement (completedAt - startedAt)

**Calcul automatique :**
```typescript
const completedAt = new Date()
const durationMs = completedAt.getTime() - task.startedAt.getTime()

await prisma.task.update({
  where: { id: task.id },
  data: {
    completedAt,
    durationMs
  }
})
```

#### Section : Outcome (fourni par l'agent)

- **`summary`** : Résumé de ce qui a été fait (2-4 phrases)
- **`achievements`** : Array (peut être `[]` si rien de concret)
- **`limitations`** : Array (peut être `[]` si pas de compromis)
- **`manualReviewNeeded`** : Boolean (si l'agent veut qu'un humain vérifie)

**Exemple :**
```typescript
await prisma.task.update({
  where: { id: taskId },
  data: {
    summary: 'JWT middleware créé et testé avec succès',
    achievements: [
      'Middleware vérifie signature JWT',
      'Tests passent (100% coverage)'
    ],
    limitations: [
      'Refresh tokens non implémentés (feature future)'
    ],
    manualReviewNeeded: false
  }
})
```

#### Section : Files (calculé par le MCP)

- **`filesAdded`**, **`filesModified`**, **`filesDeleted`** : Résultat du Git diff
- **`unexpectedFiles`** : Fichiers modifiés mais hors du scope déclaré
- **`warnings`** : Messages d'alerte (ex: "⚠️ Fichier hors scope détecté")

**Calcul automatique :**
```typescript
// Git diff retourne :
// A  src/auth/jwt.ts
// M  package.json
// D  src/utils/old-jwt.ts

await prisma.task.update({
  where: { id: taskId },
  data: {
    filesAdded: ['src/auth/jwt.ts'],
    filesModified: ['package.json'],
    filesDeleted: ['src/utils/old-jwt.ts'],
    scopeMatch: true,
    unexpectedFiles: [],
    warnings: []
  }
})
```

---

### Decision

**Rôle :** Capture une décision architecturale importante.

**Quand logger :**
- Choix de librairie
- Pattern architectural
- Compromis technique

**Champs :**
- `category` : Type de décision (enum)
- `question` : Question posée
- `optionsConsidered` : Options évaluées
- `chosen` : Option choisie
- `reasoning` : Justification (1-2 phrases)
- `tradeOffs` : Compromis acceptés (optionnel)

**Exemple :**
```typescript
await prisma.decision.create({
  data: {
    taskId: 'clx456',
    category: DecisionCategory.LIBRARY_CHOICE,
    question: 'Quelle librairie de validation ?',
    optionsConsidered: ['Zod', 'Yup', 'Joi'],
    chosen: 'Zod',
    reasoning: 'Meilleur typage TypeScript natif',
    tradeOffs: 'Moins de plugins que Joi'
  }
})
```

---

### Issue

**Rôle :** Capture un problème rencontré pendant l'exécution.

**Types :**
- `DOC_GAP` : Documentation manquante/obsolète
- `BUG` : Bug rencontré dans une librairie/code
- `DEPENDENCY_CONFLICT` : Conflit de versions
- `UNCLEAR_REQUIREMENT` : Spécification floue
- `OTHER` : Autre problème

**Champs :**
- `type` : Type du problème (enum)
- `description` : Description du problème
- `resolution` : Comment il a été résolu
- `requiresHumanReview` : Boolean (review humaine nécessaire ?)

**Exemple :**
```typescript
await prisma.issue.create({
  data: {
    taskId: 'clx456',
    type: IssueType.DOC_GAP,
    description: 'La doc NextAuth v5 sur les callbacks est obsolète',
    resolution: 'J\'ai utilisé les exemples GitHub officiels',
    requiresHumanReview: false
  }
})
```

---

### Milestone

**Rôle :** Updates temps réel pour l'UI (ex: "Installation des dépendances...").

**Champs :**
- `message` : Message court
- `progress` : 0-100 (optionnel)
- `metadata` : JSON libre (optionnel)

**Léger :** Ne pas abuser, 3-5 milestones par task max.

**Exemple :**
```typescript
await prisma.milestone.create({
  data: {
    taskId: 'clx456',
    message: 'Running tests...',
    progress: 75,
    metadata: { test_suite: 'auth' }
  }
})
```

---

## Indexes

Les indexes sont optimisés pour les requêtes fréquentes :

| Modèle | Index | Usage |
|--------|-------|-------|
| Workflow | `[status]` | Filtrage workflows en cours |
| Workflow | `[createdAt]` | Tri chronologique |
| Task | `[workflowId]` | Requêtes par workflow |
| Task | `[parentTaskId]` | Navigation hiérarchique |
| Task | `[status]` | Filtrage tasks en cours |
| Task | `[startedAt]` | Tri chronologique |
| Decision | `[taskId]` | Requêtes par task |
| Decision | `[createdAt]` | Tri chronologique |
| Issue | `[taskId]` | Requêtes par task |
| Issue | `[createdAt]` | Tri chronologique |
| Milestone | `[taskId]` | Requêtes par task |
| Milestone | `[createdAt]` | Tri chronologique |

---

## Cascade Delete

Quand un Workflow est supprimé, **toutes** ses Tasks/Decisions/Issues/Milestones sont supprimées automatiquement.

```prisma
model Task {
  workflow Workflow @relation(fields: [workflowId], references: [id], onDelete: Cascade)
}

model Decision {
  task Task @relation(fields: [taskId], references: [id], onDelete: Cascade)
}
```

**Exemple :**
```typescript
// Supprimer workflow
await prisma.workflow.delete({ where: { id: 'clx123' } })

// → TOUTES les Tasks de ce workflow sont supprimées
// → TOUTES les Decisions/Issues/Milestones de ces Tasks sont supprimées
```

---

## JSON Fields

Les champs JSON (`plan`, `snapshotData`, `metadata`) permettent de la flexibilité sans migration.

**Best practices :**
- Utiliser Zod pour valider côté app
- Ne pas stocker de données critiques (préférer champs typés)
- Limiter la taille (max 10KB par JSON)

**Exemple avec validation Zod :**
```typescript
const snapshotDataSchema = z.object({
  gitHash: z.string(),
})

const validated = snapshotDataSchema.parse(task.snapshotData)
// validated.gitHash est type-safe
```

---

## Migrations

### Initialisation

**Avec PostgreSQL (recommandé) :**
```bash
cd packages/shared

# Créer le fichier .env
cat > .env << EOF
DATABASE_PROVIDER="postgresql"
DATABASE_URL="postgresql://user:password@localhost:5432/mcp_tracker?schema=public"
EOF

# Lancer la migration
npx prisma migrate dev --name init
```

**Avec SQLite (alternatif) :**
```bash
cd packages/shared

# Créer le fichier .env
cat > .env << EOF
DATABASE_PROVIDER="sqlite"
DATABASE_URL="file:./dev.db"
EOF

# Lancer la migration
npx prisma migrate dev --name init
```

### Génération du Client Prisma

```bash
npx prisma generate
```

Le client TypeScript sera généré dans `node_modules/@prisma/client` avec **tous les enums typés**.

---

## Accès depuis le Monorepo

```typescript
// Dans mcp-server ou web-ui
import { PrismaClient, TaskStatus, DecisionCategory } from '@prisma/client'

const prisma = new PrismaClient()

// Typage strict grâce aux enums
await prisma.task.create({
  data: {
    status: TaskStatus.IN_PROGRESS, // ✅ Typage strict
    // status: "in progress" // ❌ Erreur TypeScript
  }
})
```

### Singleton Pattern

Pour éviter d'épuiser les connexions DB, utiliser un singleton :

```typescript
// mcp-server/src/db.ts
import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}
```

---

## Requêtes Typiques

### Récupérer un Workflow avec toutes ses Tasks

```typescript
const workflow = await prisma.workflow.findUnique({
  where: { id: workflowId },
  include: {
    tasks: {
      include: {
        decisions: true,
        issues: true,
        milestones: true,
        subtasks: true
      },
      orderBy: { startedAt: 'asc' }
    }
  }
})
```

### Récupérer toutes les Tasks en cours

```typescript
const inProgressTasks = await prisma.task.findMany({
  where: {
    status: TaskStatus.IN_PROGRESS
  },
  include: {
    workflow: true
  },
  orderBy: {
    startedAt: 'desc'
  }
})
```

### Récupérer les Décisions d'une Task

```typescript
const decisions = await prisma.decision.findMany({
  where: {
    taskId: taskId
  },
  orderBy: {
    createdAt: 'asc'
  }
})
```

---

**Ce document définit le schéma de base de données complet.**
Pour détails sur l'utilisation, voir :
- [MCP Protocol](./mcp-protocol.md) : Comment les tools MCP écrivent en DB
- [Architecture](./architecture.md) : Structure du projet
