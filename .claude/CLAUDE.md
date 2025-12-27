# Mission Control - Multi-Agent Workflow Orchestration & Observability

## Description

Mission Control is a unified system for **orchestrating** and **tracking** multi-agent workflows. It combines:

1. **Mission Orchestration** - Multi-phase missions with sub-agents coordination
2. **Workflow Observability** - Capture INTENTION, REASONING, and CODE CHANGES
3. **Real-time Dashboard** - WebUI for monitoring progress

**Key Features**:
- Mission → Phase → Task hierarchy with auto-phase management
- Structured decision/issue logging with reasoning
- Automatic Git diff capture (committed + working tree)
- Real-time WebSocket updates

**Type**: Monorepo (pnpm) with MCP Server + Web UI + Shared Types

---

## Standards

### Architecture

- **REQUIRED**: Monorepo pnpm with strict package isolation
- **REQUIRED**: Clean Architecture (business logic separate from infrastructure)
- **REQUIRED**: SOC - shared = types, mcp-server = logic, web-ui = presentation
- **FORBIDDEN**: Cross-package imports (except via shared)

**Packages**:
```
packages/
├── shared/        # Prisma schema + types (source of truth)
├── mcp-server/    # MCP Server (stdio protocol)
└── web-ui/        # Next.js Dashboard
```

### TypeScript

- **Strict mode**: `strict: true`
- **FORBIDDEN**: `any` (use `unknown` if needed)
- **REQUIRED**: Explicit types for public functions
- **REQUIRED**: Prisma enums for all status/categories (type safety DB + app)

### MCP Protocol

- **REQUIRED**: Strict MCP protocol compliance (stdio, JSON-RPC 2.0)
- **REQUIRED**: Structured reporting (validated JSON schemas)
- **REQUIRED**: Robust Git snapshot (union commits + working tree) in `complete_task`
- **FORBIDDEN**: Context flooding (max 3-6 MCP calls per task)

### Database

- **REQUIRED**: Prisma ORM only (no raw SQL)
- **Provider**: SQLite (standalone distribution)
- **REQUIRED**: Migrations via Prisma (no sync())
- **Note**: Arrays stored as JSON strings, enums as TEXT

### Git

- **Convention**: Conventional Commits (`type(scope): description`)
- **Types**: `feat`, `fix`, `refactor`, `docs`, `test`, `chore`
- **FORBIDDEN**: Non-conventional commits

---

## Reference Documentation

**Agents MUST consult these documents for full context:**

| Document | Content |
|----------|---------|
| `.claude/docs/architecture.md` | Monorepo, MCP protocol, Clean Architecture |
| `.claude/docs/mcp-protocol.md` | 9 MCP tools specifications, Git snapshot |
| `.claude/docs/database.md` | Prisma schema, Mission/Phase/Task models |
| `.claude/docs/standards.md` | Code conventions, TypeScript, validation |
| `.claude/docs/tech-stack.md` | Technologies and justifications |

**Mission System docs:**
| Document | Content |
|----------|---------|
| `mission-system/docs/architecture.md` | Mission orchestration patterns |
| `mission-system/docs/orchestrator-guide.md` | Orchestrator MCP usage |
| `mission-system/docs/agent-integration.md` | Sub-agent integration |
| `mission-system/docs/mcp-instructions.md` | MCP instruction templates |

---

## Project Structure

```
mission-control/
├── packages/
│   ├── shared/                  # Source of truth (Prisma + types)
│   │   ├── prisma/
│   │   │   ├── schema.prisma    # With type-safe enums
│   │   │   └── migrations/
│   │   └── .env                 # DATABASE_URL
│   │
│   ├── mcp-server/              # MCP Server
│   │   └── src/
│   │       ├── index.ts         # Entry point (stdio)
│   │       ├── db.ts            # Prisma singleton
│   │       ├── tools/           # 9 MCP tools
│   │       │   ├── start-mission.ts
│   │       │   ├── complete-mission.ts
│   │       │   ├── get-context.ts
│   │       │   ├── start-task.ts
│   │       │   ├── complete-task.ts
│   │       │   ├── log-decision.ts
│   │       │   ├── log-issue.ts
│   │       │   ├── log-milestone.ts
│   │       │   └── start-workflow.ts  # Legacy alias
│   │       ├── websocket/       # Real-time events
│   │       └── utils/
│   │
│   └── web-ui/                  # Next.js Dashboard
│       └── src/
│           ├── app/
│           │   ├── page.tsx           # Home
│           │   ├── missions/          # Missions list & detail
│           │   └── workflow/          # Legacy workflow views
│           ├── components/
│           │   └── mission/           # Mission components
│           └── lib/
│
├── mission-system/              # Orchestration docs & templates
│   ├── docs/
│   │   ├── architecture.md
│   │   ├── orchestrator-guide.md
│   │   ├── agent-integration.md
│   │   ├── mcp-instructions.md
│   │   ├── templates/
│   │   └── profiles/
│   └── agents/
│       └── mission-architect.md
│
├── scripts/                     # Setup & verification
│   ├── setup.sh
│   ├── symlink.sh
│   ├── generate-mcp-config.sh
│   └── verify-mcp.sh
│
└── .claude/                     # Dev config
    ├── CLAUDE.md               # This file
    ├── docs/                   # Technical docs
    └── plans/                  # Planning docs
```

---

## MCP Tools Overview

Mission Control exposes **9 MCP tools**:

### Mission Orchestration (3 tools)

| Tool | Purpose |
|------|---------|
| `start_mission` | Create mission with profile (simple/standard/complex) |
| `complete_mission` | Finalize mission with summary and metrics |
| `get_context` | Query mission state (decisions, blockers, phases) |

### Task Execution (5 tools)

| Tool | Purpose |
|------|---------|
| `start_task` | Start task with Git snapshot, auto-create phase |
| `complete_task` | Complete task with Git diff, optionally complete phase |
| `log_decision` | Record architectural decision with reasoning |
| `log_issue` | Report problem/blocker (can require human review) |
| `log_milestone` | Progress update for real-time UI |

### Legacy (1 tool)

| Tool | Purpose |
|------|---------|
| `start_workflow` | Alias for backward compatibility |

**Smart Capture**: 3-6 MCP calls per task (no context flooding)

---

## Key Principles

### 1. Monorepo = Strict Isolation

```
✅ GOOD: shared exports types, mcp-server imports from shared
import { PrismaClient } from '@prisma/client'

❌ BAD: mcp-server imports directly from web-ui
import { TreeView } from '../../../web-ui/src/components/TreeView'
```

### 2. Mission → Phase → Task Hierarchy

```
Mission (objective, profile)
  └── Phase 1 (auto-created on first task)
        └── Task 1.1 (orchestrator)
        └── Task 1.2 (subagent: feature-implementer)
  └── Phase 2
        └── Task 2.1 (orchestrator)
```

### 3. Robust Git Snapshot (CRITICAL)

In `complete_task`, we capture ALL agent work:

```typescript
// DIFF 1: Commits made during task
git diff <start_hash> HEAD --name-status

// DIFF 2: Uncommitted working tree
git diff HEAD --name-status

// UNION = Absolute truth of agent work
```

### 4. Type-Safe Enums

```typescript
// ✅ GOOD: Prisma enums
import { TaskStatus, CallerType } from '@prisma/client'
await prisma.task.create({
  data: {
    status: TaskStatus.IN_PROGRESS,
    callerType: CallerType.ORCHESTRATOR
  }
})

// ❌ BAD: Magic strings
await prisma.task.create({
  data: { status: 'in_progress' }  // TypeScript error
})
```

### 5. Caller Context

Tasks track who called them:

```typescript
// Orchestrator starting a task
await mcp.call('start_task', {
  mission_id: 'clx123',
  phase: 1,
  caller_type: 'orchestrator',
  name: 'Implement auth',
  goal: 'Add JWT authentication'
})

// Sub-agent (e.g., feature-implementer) starting a task
await mcp.call('start_task', {
  mission_id: 'clx123',
  phase: 1,
  caller_type: 'subagent',
  agent_name: 'feature-implementer',
  name: 'Create auth middleware',
  goal: 'JWT verification middleware'
})
```

---

## Workflow

### Simple Features (< 3 files)

Use main chat directly (has access to this CLAUDE.md)

### Complex Features

1. **Brainstorm** - Strategic discussion
2. **Plan** - Generate structured plan in `.claude/plans/`
3. **Implement** - Follow monorepo architecture strictly
4. **Review** - Verify architecture, standards, security

### Commits

**IMPORTANT**: Only commit when explicitly requested.

```bash
git add .
git commit -m "feat(mcp-server): add get_context tool for mission queries"
```

---

## Agent Notes

### When to Read Docs

| Document | When |
|----------|------|
| `architecture.md` | Creating/modifying monorepo structure |
| `mcp-protocol.md` | Implementing/modifying MCP tools |
| `database.md` | Creating/modifying Prisma schema |
| `standards.md` | Always (every feature) |
| `orchestrator-guide.md` | Implementing orchestrator logic |
| `agent-integration.md` | Adding MCP support to external agents |

### Critical Points

1. **Git Snapshot**: Union of 2 diffs (commits + working tree) in `complete_task`
2. **Enums**: Use Prisma enums, NEVER magic strings
3. **Validation**: Zod for ALL user inputs
4. **Isolation**: Packages communicate ONLY via shared
5. **Type Safety**: `strict: true`, no `any`
6. **Caller Context**: Always specify `caller_type` in `start_task`

### Pre-Commit Checklist

- [ ] Code in correct package (shared/mcp-server/web-ui)
- [ ] Strict TypeScript types (no `any`)
- [ ] Prisma enums used (no magic strings)
- [ ] Zod validation (if user inputs)
- [ ] Git snapshot logic respected (if complete_task)
- [ ] No hardcoded secrets
- [ ] Conventional commit message
- [ ] Technical docs consulted

---

**Version**: 2.0
**Last Updated**: December 2024
