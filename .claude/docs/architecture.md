# Architecture

## Core Principle: Clean Architecture + Feature-Based

Mission Control follows a **modular monorepo** architecture with strict separation of concerns (SOC) and feature isolation.

### Why This Architecture?

- Strict separation of responsibilities (shared, mcp-server, web-ui)
- Code reuse (shared Prisma types)
- Parallel development (independent packages)
- Scalability (easy to add new packages)

---

## Project Structure

```
mission-control/
├── packages/
│   ├── shared/            # Types + Prisma Schema (source of truth)
│   ├── mcp-server/        # MCP Server (stdio protocol)
│   └── web-ui/            # Next.js Dashboard
├── mission-system/        # Orchestration docs & templates
│   ├── docs/
│   └── agents/
├── scripts/               # Setup & verification scripts
├── pnpm-workspace.yaml    # Monorepo config
└── package.json           # Workspace scripts
```

---

## MCP Protocol

The **Model Context Protocol (MCP)** enables AI agents to interact with tools via **stdio** (standard input/output).

```
AI Agent (Claude Code)
        ↓
    MCP Client
        ↓ stdio
    MCP Server ←→ SQLite (local file)
        ↓ WebSocket
    Web UI (real-time)
```

**Characteristics:**
- Communication via JSON-RPC over stdin/stdout
- No HTTP server (no port to open)
- Launched automatically by the agent
- Synchronous request/response

---

## Mission → Phase → Task Hierarchy

Mission Control introduces a hierarchical model for multi-agent orchestration:

```
Mission (objective, profile: simple|standard|complex)
│
├── Phase 1 (auto-created on first task)
│   ├── Task 1.1 (caller: orchestrator)
│   └── Task 1.2 (caller: subagent, agent: feature-implementer)
│
├── Phase 2
│   └── Task 2.1 (caller: orchestrator)
│
└── Phase 3
    └── ...
```

**Key Concepts:**

| Concept | Description |
|---------|-------------|
| **Mission** | High-level objective with profile (simple=2 phases, standard=3, complex=4+) |
| **Phase** | Sequential execution step (auto-created when first task starts) |
| **Task** | Unit of work with Git snapshot and caller context |
| **CallerType** | Who started the task: `orchestrator` or `subagent` |

**Auto-Phase Management:**
- First `start_task` with `phase: 1` auto-creates Phase 1
- `complete_task` with `phase_complete: true` marks phase as done
- Mission tracks `currentPhase` for progress

---

## Package: shared

**Role:** Shared types + centralized Prisma Schema

```
packages/shared/
├── prisma/
│   ├── schema.prisma      # Unified DB schema
│   └── migrations/        # SQL migrations
├── src/
│   └── index.ts           # Re-export Prisma types
├── package.json
├── tsconfig.json
└── .env                   # DATABASE_URL
```

**Responsibilities:**
- Define database schema (Prisma)
- Generate typed Prisma client
- Export types for other packages
- NO business logic

**Usage:**
```typescript
import { PrismaClient, TaskStatus, CallerType } from '@prisma/client'
```

---

## Package: mcp-server

**Role:** MCP Server exposing 9 tools for mission orchestration and tracking

```
packages/mcp-server/
├── src/
│   ├── index.ts               # MCP entry point (stdio)
│   ├── db.ts                  # Prisma client singleton
│   ├── tools/
│   │   ├── start-mission.ts   # Mission orchestration
│   │   ├── complete-mission.ts
│   │   ├── get-context.ts
│   │   ├── start-task.ts      # Task execution (+ Git snapshot)
│   │   ├── complete-task.ts   # (+ Git diff)
│   │   ├── log-decision.ts
│   │   ├── log-issue.ts
│   │   ├── log-milestone.ts
│   │   └── start-workflow.ts  # Legacy alias
│   ├── websocket/             # Real-time event emitters
│   └── utils/
│       ├── git-snapshot.ts    # Robust Git logic
│       ├── checksum.ts        # Non-Git fallback
│       └── scope-verify.ts    # Scope verification
├── package.json
└── tsconfig.json
```

**Responsibilities:**
- Implement 9 MCP tools (see mcp-protocol.md)
- Manage Git snapshots (union commits + working tree)
- Calculate modified files automatically
- Validate declared scope vs reality
- Write to database (Prisma)
- Emit WebSocket events for real-time UI
- NO user interface, NO HTTP server

**MCP Server Registration:**
```typescript
import { Server } from '@modelcontextprotocol/sdk/server/index.js'

const server = new Server(
  { name: 'mission-control', version: '2.0.0' },
  { capabilities: { tools: {} } }
)

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    startMissionTool,
    completeMissionTool,
    getContextTool,
    startTaskTool,
    completeTaskTool,
    // ... 4 more tools
  ]
}))
```

---

## Package: web-ui

**Role:** Next.js Dashboard for real-time visualization

```
packages/web-ui/
├── src/
│   ├── app/
│   │   ├── page.tsx                 # Home
│   │   ├── missions/
│   │   │   ├── page.tsx             # Missions list
│   │   │   └── [id]/page.tsx        # Mission detail
│   │   └── workflow/[id]/
│   │       └── page.tsx             # Legacy workflow detail
│   ├── components/
│   │   ├── mission/
│   │   │   ├── MissionCard.tsx
│   │   │   ├── PhaseTimeline.tsx
│   │   │   ├── PhaseCard.tsx
│   │   │   ├── AgentBadge.tsx
│   │   │   └── BlockerAlert.tsx
│   │   ├── TreeView.tsx
│   │   ├── DiffViewer.tsx
│   │   └── Timeline.tsx
│   ├── hooks/
│   │   ├── useRealtimeMissions.ts
│   │   └── useRealtimeMission.ts
│   └── lib/
│       ├── prisma.ts
│       └── websocket.ts
├── package.json
└── next.config.ts
```

**Responsibilities:**
- Read database via API routes
- Display mission → phase → task hierarchy
- Visualize file diffs
- Real-time updates (WebSocket)
- NO database writes (read-only)

---

## Data Flow

### Mission Creation

```
1. Agent calls start_mission via MCP
   ↓
2. MCP Server validates arguments (Zod)
   ↓
3. MCP Server creates Mission in DB (Prisma)
   ↓
4. MCP Server emits WebSocket event (mission:created)
   ↓
5. Web UI receives real-time update
   ↓
6. Web UI displays new mission
```

### Task Completion (CRITICAL)

```
1. Agent calls complete_task via MCP
   ↓
2. MCP Server:
   a) Calculates duration (completedAt - startedAt)
   b) Runs Git diff (commits + working tree union)
   c) Parses files Added/Modified/Deleted
   d) Verifies scope (areas vs actual files)
   e) Generates warnings if out of scope
   ↓
3. MCP Server updates DB with ALL data
   ↓
4. If phase_complete=true:
   a) Updates Phase status to COMPLETED
   b) Updates Mission currentPhase
   ↓
5. Emits WebSocket events
   ↓
6. Web UI displays:
   - Modified files (with diff viewer)
   - Scope warnings
   - Task duration
   - Achievements/Limitations
```

---

## Isolation Rules

### shared Package

**CAN contain:**
- Prisma schema
- Prisma-generated types
- TypeScript enums

**CANNOT contain:**
- Business logic
- API calls
- MCP/UI specific code

### mcp-server Package

**CAN:**
- Import from `@prisma/client` (shared)
- Import from `simple-git`, `glob`, etc.
- Write to DB via Prisma
- Emit WebSocket events

**CANNOT:**
- Have UI code
- Expose HTTP endpoints
- Import from web-ui

### web-ui Package

**CAN:**
- Import from `@prisma/client` (shared)
- Read DB via Prisma
- Expose Next.js API routes
- Listen to WebSocket events

**CANNOT:**
- Write to DB (workflows created only via MCP)
- Import from mcp-server
- Call MCP tools directly

---

## Architectural Patterns

### 1. Prisma Client Singleton

Avoid multiple Prisma instances (exhausts DB connections).

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

### 2. Robust Git Snapshot (Union Commits + Working Tree)

**Problem:** Capture ALL changes (committed AND uncommitted).

**Solution:**
```typescript
// At start_task: Store current hash
const startHash = await git.revparse(['HEAD']) // → "abc123"

// At complete_task: Union of 2 diffs
const committedDiff = await git.diff([startHash, 'HEAD', '--name-status'])
const workingTreeDiff = await git.diff(['HEAD', '--name-status'])

// Union = absolute truth
const allChanges = merge(committedDiff, workingTreeDiff)
```

### 3. Boundary Validation

All MCP inputs are validated BEFORE business logic.

```typescript
// tools/start-mission.ts
export async function handleStartMission(args: unknown) {
  // 1. Zod validation
  const validated = startMissionSchema.parse(args)

  // 2. Business logic
  const mission = await prisma.mission.create({
    data: validated
  })

  return { mission_id: mission.id }
}
```

### 4. Feature Isolation

Each MCP tool is isolated in its own file.

```
tools/
├── start-mission.ts      # Mission lifecycle
├── complete-mission.ts
├── get-context.ts        # Mission queries
├── start-task.ts         # Task lifecycle (+ snapshot)
├── complete-task.ts      # (+ diff)
├── log-decision.ts       # Structured logging
├── log-issue.ts
├── log-milestone.ts
└── start-workflow.ts     # Legacy support
```

---

## Security

### 1. No Hardcoded Secrets

```typescript
// ❌ BAD
const DATABASE_URL = 'postgresql://user:pass@localhost/db'

// ✅ GOOD
const DATABASE_URL = process.env.DATABASE_URL!
if (!DATABASE_URL) throw new Error('DATABASE_URL required')
```

### 2. Strict Validation

All MCP inputs pass through Zod schemas.

### 3. Filesystem Isolation

MCP server can ONLY access the project's Git directory (via simple-git).

### 4. Read-Only UI

The web interface CANNOT modify missions/workflows (data immutability).

---

## Performance

### Database Indexes

```prisma
model Task {
  @@index([workflowId])      // Queries by workflow
  @@index([phaseId])         // Queries by phase
  @@index([status])          // Filter by status
  @@index([startedAt])       // Chronological sort
  @@index([callerType])      // Filter by caller
  @@index([agentName])       // Filter by agent
}

model Phase {
  @@unique([missionId, number])  // Unique phase per mission
  @@index([missionId])
}

model Mission {
  @@index([status])
  @@index([createdAt])
}
```

### Cascade Deletions

Automatic deletion of related data:
```prisma
model Phase {
  mission Mission @relation(fields: [missionId], references: [id], onDelete: Cascade)
}

model Task {
  phase Phase? @relation(fields: [phaseId], references: [id], onDelete: Cascade)
}
```

When a Mission is deleted → ALL its Phases/Tasks/Decisions/Issues/Milestones are deleted.

---

**This document defines the global architecture.**
For specific details, see:
- [MCP Protocol](./mcp-protocol.md): 9 tools specifications
- [Database](./database.md): Complete Prisma schema
- [Standards](./standards.md): Code conventions
- [Tech Stack](./tech-stack.md): Technologies used
