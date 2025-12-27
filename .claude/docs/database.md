# Database Schema

## Overview

Mission Control uses **Prisma ORM** with **SQLite** as the database.

**Characteristics:**
- Local portable file (no external DB server required)
- Enums stored as TEXT with app-side validation
- Arrays stored as JSON strings
- TypeScript type safety via generated Prisma client

---

## Model Hierarchy

```
Mission
├── Phase (1..n)
│   └── Task (0..n)
│       ├── Decision (0..n)
│       ├── Issue (0..n)
│       └── Milestone (0..n)

Workflow (legacy)
└── Task (0..n)
    ├── Decision
    ├── Issue
    └── Milestone
```

---

## Prisma Schema

### Enums (Type Safety)

```prisma
// Note: SQLite stores enums as TEXT
// Type safety enforced by Prisma client

// Mission-related
enum MissionProfile { SIMPLE, STANDARD, COMPLEX }
enum MissionStatus { PENDING, IN_PROGRESS, COMPLETED, FAILED, BLOCKED }
enum PhaseStatus { PENDING, IN_PROGRESS, COMPLETED, FAILED }
enum CallerType { ORCHESTRATOR, SUBAGENT }

// Task-related
enum WorkflowStatus { IN_PROGRESS, COMPLETED, FAILED }
enum TaskStatus { IN_PROGRESS, SUCCESS, PARTIAL_SUCCESS, FAILED }
enum DecisionCategory { ARCHITECTURE, LIBRARY_CHOICE, TRADE_OFF, WORKAROUND, OTHER }
enum IssueType { DOC_GAP, BUG, DEPENDENCY_CONFLICT, UNCLEAR_REQUIREMENT, OTHER }
enum TestsStatus { PASSED, FAILED, NOT_RUN }
```

### Mission Model

```prisma
model Mission {
  id          String   @id @default(cuid())
  name        String
  description String?

  // Mission-specific
  objective   String   // Measurable goal
  scope       String?  // What's included/excluded
  constraints String?  // Technical limits
  profile     String   @default("STANDARD") // MissionProfile

  // Execution state
  status       String @default("PENDING") // MissionStatus
  currentPhase Int    @default(0)
  totalPhases  Int    @default(1)

  // Metadata
  missionPath String?   // .claude/missions/<name>/
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
  completedAt DateTime?

  // Relations
  phases Phase[]

  @@index([status])
  @@index([createdAt])
}
```

### Phase Model

```prisma
model Phase {
  id        String  @id @default(cuid())
  missionId String
  mission   Mission @relation(fields: [missionId], references: [id], onDelete: Cascade)

  number      Int     // Phase sequence (1, 2, 3...)
  name        String
  description String?

  // Execution
  status     String  @default("PENDING") // PhaseStatus
  isParallel Boolean @default(false)     // Can tasks run in parallel?

  // Timing
  startedAt   DateTime?
  completedAt DateTime?

  // Relations
  tasks Task[]

  @@unique([missionId, number])
  @@index([missionId])
}
```

### Task Model

```prisma
model Task {
  id           String  @id @default(cuid())
  workflowId   String
  parentTaskId String?
  name         String
  goal         String
  status       String  @default("IN_PROGRESS") // TaskStatus

  // Mission system: Phase relation (optional for backward compat)
  phaseId String?
  phase   Phase?  @relation(fields: [phaseId], references: [id], onDelete: Cascade)

  // Caller context
  callerType  String? // CallerType: ORCHESTRATOR | SUBAGENT
  agentName   String? // e.g., "feature-implementer"
  agentPrompt String? // The prompt given to sub-agent (for replay)

  // Scope (JSON array)
  areas String @default("[]")

  // Snapshot data (Git or Checksum)
  snapshotId   String?
  snapshotType String?
  snapshotData String? // JSON string

  // Timing
  startedAt   DateTime  @default(now())
  completedAt DateTime?
  durationMs  Int?

  // Outcome
  summary            String?
  achievements       String  @default("[]") // JSON array
  limitations        String  @default("[]") // JSON array
  manualReviewNeeded Boolean @default(false)
  manualReviewReason String?
  nextSteps          String  @default("[]") // JSON array

  // Metadata
  packagesAdded    String  @default("[]") // JSON array
  packagesRemoved  String  @default("[]") // JSON array
  commandsExecuted String  @default("[]") // JSON array
  testsStatus      String? // TestsStatus

  // Token metrics
  tokensInput  Int?
  tokensOutput Int?

  // Files changed
  filesAdded    String @default("[]") // JSON array
  filesModified String @default("[]") // JSON array
  filesDeleted  String @default("[]") // JSON array

  // Verification
  scopeMatch      Boolean?
  unexpectedFiles String  @default("[]") // JSON array
  warnings        String  @default("[]") // JSON array

  // Relations
  workflow   Workflow    @relation(fields: [workflowId], references: [id], onDelete: Cascade)
  parentTask Task?       @relation("TaskHierarchy", fields: [parentTaskId], references: [id])
  subtasks   Task[]      @relation("TaskHierarchy")
  decisions  Decision[]
  issues     Issue[]
  milestones Milestone[]

  @@index([workflowId])
  @@index([parentTaskId])
  @@index([status])
  @@index([startedAt])
  @@index([phaseId])
  @@index([callerType])
  @@index([agentName])
}
```

### Workflow Model (Legacy)

```prisma
model Workflow {
  id          String  @id @default(cuid())
  name        String
  description String?
  plan        String? // JSON string
  status      String  @default("IN_PROGRESS") // WorkflowStatus
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  // Aggregated metrics
  totalDurationMs Int?
  totalTokens     Int?

  tasks Task[]

  @@index([status])
  @@index([createdAt])
}
```

### Decision Model

```prisma
model Decision {
  id                String   @id @default(cuid())
  taskId            String
  category          String   // DecisionCategory
  question          String
  optionsConsidered String   @default("[]") // JSON array
  chosen            String
  reasoning         String
  tradeOffs         String?
  createdAt         DateTime @default(now())

  task Task @relation(fields: [taskId], references: [id], onDelete: Cascade)

  @@index([taskId])
  @@index([createdAt])
}
```

### Issue Model

```prisma
model Issue {
  id                  String   @id @default(cuid())
  taskId              String
  type                String   // IssueType
  description         String
  resolution          String
  requiresHumanReview Boolean  @default(false)
  createdAt           DateTime @default(now())

  task Task @relation(fields: [taskId], references: [id], onDelete: Cascade)

  @@index([taskId])
  @@index([createdAt])
}
```

### Milestone Model

```prisma
model Milestone {
  id        String   @id @default(cuid())
  taskId    String
  message   String
  progress  Int?     // 0-100
  metadata  String?  // JSON string
  createdAt DateTime @default(now())

  task Task @relation(fields: [taskId], references: [id], onDelete: Cascade)

  @@index([taskId])
  @@index([createdAt])
}
```

### ServerInfo Model

```prisma
model ServerInfo {
  id            String   @id @default("singleton")
  websocketPort Int
  startedAt     DateTime @default(now())
  lastHeartbeat DateTime @default(now())
  processId     Int?
}
```

---

## SQLite Configuration

### Environment

```bash
# packages/shared/.env
DATABASE_URL="file:./dev.db"
```

### SQLite Specifics

- No external DB server needed
- Single file (dev.db) in `packages/shared/`
- Ideal for npm/binary standalone distribution
- TypeScript type safety preserved via Prisma

### Enum Handling

Prisma automatically handles enums for SQLite:
- Stored as `TEXT` in database
- App-side validation by Prisma client
- Full TypeScript type safety

```typescript
// Type safe with SQLite
await prisma.mission.create({
  data: {
    status: 'IN_PROGRESS', // ✅ Type safe
    profile: 'STANDARD',   // ✅ Type safe
  }
})
```

### Array Handling

SQLite doesn't natively support arrays. Prisma stores them as JSON strings:

```typescript
// Arrays handled automatically
await prisma.task.create({
  data: {
    areas: JSON.stringify(['auth', 'api']),
    filesModified: JSON.stringify(['src/auth.ts']),
  }
})

// Reading is transparent
const task = await prisma.task.findUnique({ where: { id } })
const areas = JSON.parse(task.areas) // ['auth', 'api']
```

---

## Model Explanations

### Mission

**Role:** Top-level container for multi-phase orchestration.

| Field | Description |
|-------|-------------|
| `objective` | Measurable goal for the mission |
| `profile` | Complexity: SIMPLE (2), STANDARD (3), COMPLEX (4+) |
| `status` | PENDING → IN_PROGRESS → COMPLETED/FAILED/BLOCKED |
| `currentPhase` | Progress tracking (0 = not started) |
| `totalPhases` | Expected number of phases |

### Phase

**Role:** Sequential execution step within a mission.

| Field | Description |
|-------|-------------|
| `number` | Phase sequence (1, 2, 3...) |
| `status` | PENDING → IN_PROGRESS → COMPLETED/FAILED |
| `isParallel` | Can tasks within this phase run in parallel? |

**Auto-creation:** Phases are created automatically when the first task with that phase number is started.

### Task

**Role:** Unit of work with Git snapshot and caller context.

#### Caller Context

| Field | Description |
|-------|-------------|
| `callerType` | ORCHESTRATOR or SUBAGENT |
| `agentName` | Name of the sub-agent (e.g., "feature-implementer") |
| `agentPrompt` | Prompt given to sub-agent (for replay) |

#### Snapshot & Timing

| Field | Description |
|-------|-------------|
| `snapshotType` | "git" or "checksum" |
| `snapshotData` | `{ gitHash: "abc123" }` or `{ checksums: {...} }` |
| `startedAt` | Auto-set at `start_task` |
| `completedAt` | Auto-set at `complete_task` |
| `durationMs` | Calculated: completedAt - startedAt |

#### Files (Auto-calculated)

| Field | Description |
|-------|-------------|
| `filesAdded` | Files created during task |
| `filesModified` | Files modified during task |
| `filesDeleted` | Files deleted during task |
| `scopeMatch` | Did changes match declared `areas`? |
| `unexpectedFiles` | Files changed outside declared scope |

### Decision

**Role:** Capture architectural decisions.

| Category | When to use |
|----------|-------------|
| `ARCHITECTURE` | System design choices |
| `LIBRARY_CHOICE` | Choosing between libraries |
| `TRADE_OFF` | Accepting compromises |
| `WORKAROUND` | Technical workarounds |
| `OTHER` | Other decisions |

### Issue

**Role:** Capture problems encountered.

| Type | Description |
|------|-------------|
| `DOC_GAP` | Missing/outdated documentation |
| `BUG` | Bug in library/code |
| `DEPENDENCY_CONFLICT` | Version conflicts |
| `UNCLEAR_REQUIREMENT` | Vague specification |
| `OTHER` | Other problems |

**Note:** Issues with `requiresHumanReview: true` appear as blockers in `get_context`.

---

## Indexes

Optimized for frequent queries:

### Mission Indexes
| Index | Purpose |
|-------|---------|
| `[status]` | Filter by mission status |
| `[createdAt]` | Chronological sort |

### Phase Indexes
| Index | Purpose |
|-------|---------|
| `[missionId, number]` | Unique phase per mission |
| `[missionId]` | Get phases for mission |

### Task Indexes
| Index | Purpose |
|-------|---------|
| `[workflowId]` | Get tasks by workflow |
| `[phaseId]` | Get tasks by phase |
| `[parentTaskId]` | Hierarchy navigation |
| `[status]` | Filter by status |
| `[startedAt]` | Chronological sort |
| `[callerType]` | Filter by caller |
| `[agentName]` | Filter by agent |

---

## Cascade Deletions

When a parent is deleted, all children are automatically deleted:

```
Mission deleted
  └── All Phases deleted
        └── All Tasks deleted
              └── All Decisions/Issues/Milestones deleted

Workflow deleted
  └── All Tasks deleted
        └── All Decisions/Issues/Milestones deleted
```

---

## Common Queries

### Get Mission with Phases and Tasks

```typescript
const mission = await prisma.mission.findUnique({
  where: { id: missionId },
  include: {
    phases: {
      include: { tasks: true },
      orderBy: { number: 'asc' }
    }
  }
})
```

### Get Tasks by Phase

```typescript
const tasks = await prisma.task.findMany({
  where: { phaseId },
  include: {
    decisions: true,
    issues: true,
    milestones: true
  },
  orderBy: { startedAt: 'asc' }
})
```

### Get Blockers for Mission

```typescript
const blockers = await prisma.issue.findMany({
  where: {
    requiresHumanReview: true,
    task: {
      phase: {
        missionId: missionId
      }
    }
  },
  orderBy: { createdAt: 'desc' }
})
```

### Get Tasks by Agent

```typescript
const tasks = await prisma.task.findMany({
  where: {
    agentName: 'feature-implementer',
    phase: { missionId }
  },
  orderBy: { startedAt: 'asc' }
})
```

---

## Migrations

### Initialize Database

```bash
cd packages/shared

# Create .env
echo 'DATABASE_URL="file:./dev.db"' > .env

# Run migration
npx prisma migrate dev --name init
```

### Generate Prisma Client

```bash
npx prisma generate
```

The TypeScript client is generated in `node_modules/@prisma/client` with **all enums typed**.

---

## Monorepo Access

```typescript
// In mcp-server or web-ui
import { PrismaClient, TaskStatus, CallerType, MissionStatus } from '@prisma/client'

const prisma = new PrismaClient()

// Full type safety
await prisma.mission.create({
  data: {
    name: 'Auth System',
    objective: 'Implement JWT auth',
    status: 'PENDING',      // ✅ Type safe
    profile: 'STANDARD',    // ✅ Type safe
  }
})

await prisma.task.create({
  data: {
    callerType: 'ORCHESTRATOR',  // ✅ Type safe
    status: 'IN_PROGRESS',       // ✅ Type safe
  }
})
```

### Singleton Pattern

Prevent connection exhaustion:

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

**This document defines the database schema.**
For usage details, see:
- [MCP Protocol](./mcp-protocol.md): How tools write to DB
- [Architecture](./architecture.md): Project structure
