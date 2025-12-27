# Mission Control - Vision & Architecture

## Project Identity

**Name**: `mission-control`
**Tagline**: Orchestration + Observability for Agentic Workflows

**What it is**: A unified system that:
1. **Orchestrates** multi-agent missions (phases, sub-agents, coordination)
2. **Tracks** everything via MCP tools + SQLite (decisions, progress, files)
3. **Visualizes** workflows in real-time (WebUI dashboard)

---

## Core Concepts

### Conceptual Mapping

| Mission System (before) | MCP Tracker (before) | Mission Control (merged) |
|-------------------------|----------------------|--------------------------|
| Mission | Workflow | **Mission** (= Workflow with mission metadata) |
| Phase | - | **Phase** (new entity, groups tasks) |
| Sub-agent execution | Task | **Task** (with caller context) |
| memory.md | - | **MCP Tools** (DB-backed, queryable) |
| Decisions (in memory.md) | Decision | **Decision** (structured, per-task) |
| Blockers (in memory.md) | Issue | **Issue** (with `requiresHumanReview`) |
| Progress updates | Milestone | **Milestone** (real-time tracking) |

### Key Principle: No memory.md

**Before**: Sub-agents read/write `memory.md` (full file, markdown parsing)
**After**: Sub-agents use MCP tools exclusively:

```
# Reading context
get_mission_context(mission_id, phase=2) → {decisions: [...], progress: {...}}

# Writing updates
log_decision({task_id, question, chosen, reasoning})
log_milestone({task_id, message, progress: 45})
complete_task({task_id, status: "success", outcome: {...}})
```

---

## Architecture

### Repository Structure

```
mission-control/
├── packages/
│   ├── shared/                      # Prisma schema + types (source of truth)
│   │   ├── prisma/
│   │   │   ├── schema.prisma        # Extended for missions
│   │   │   └── migrations/
│   │   └── src/
│   │       └── index.ts             # Type exports
│   │
│   ├── mcp-server/                  # MCP Server (extended)
│   │   └── src/
│   │       ├── index.ts             # Entry point
│   │       ├── tools/               # MCP tools (extended set)
│   │       │   ├── mission/         # Mission-specific tools
│   │       │   │   ├── start-mission.ts
│   │       │   │   ├── get-mission-context.ts
│   │       │   │   └── complete-mission.ts
│   │       │   ├── start-workflow.ts    # Legacy (alias to mission)
│   │       │   ├── start-task.ts        # Extended with caller context
│   │       │   ├── log-decision.ts
│   │       │   ├── log-issue.ts
│   │       │   ├── log-milestone.ts
│   │       │   └── complete-task.ts
│   │       ├── utils/
│   │       └── websocket/
│   │
│   └── web-ui/                      # Next.js Dashboard
│       └── src/
│           ├── app/
│           │   ├── page.tsx              # Missions list
│           │   ├── mission/[id]/         # Mission detail + phases
│           │   └── task/[id]/            # Task detail
│           └── components/
│               ├── MissionTimeline.tsx
│               ├── PhaseProgress.tsx
│               └── AgentActivity.tsx
│
├── mission-system/                  # Mission orchestration docs
│   ├── docs/
│   │   ├── architecture.md          # Orchestration rules
│   │   ├── templates/
│   │   │   ├── mission.md
│   │   │   ├── workflow.md
│   │   │   └── agent.md
│   │   └── profiles/
│   │       ├── simple.md
│   │       ├── standard.md
│   │       └── complex.md
│   └── agents/
│       └── mission-architect.md     # Meta-agent (creates missions)
│
├── scripts/
│   ├── setup.sh                     # Guided installation
│   ├── symlink.sh                   # Create ~/.claude/ symlinks
│   └── verify-mcp.sh                # Test MCP connection
│
├── .claude/                         # Dev config for this project
│   ├── CLAUDE.md
│   ├── docs/
│   └── plans/
│
└── package.json                     # Workspace root
```

### Symlinks Strategy

After `./scripts/setup.sh`:

```
~/.claude/
├── docs/
│   └── mission-system/              # → mission-control/mission-system/docs/
├── agents/
│   └── mission-architect.md         # → mission-control/mission-system/agents/mission-architect.md
└── settings.json                    # MCP server config (auto-generated)
```

**Note**: Other global agents (feature-planner, feature-implementer, etc.) are external to this project. They can use mission-control MCP tools but are not bundled with it.

---

## Database Schema (Extended)

### New/Modified Entities

```prisma
// === MISSION (extends Workflow) ===
model Mission {
  id            String    @id @default(cuid())
  name          String
  description   String?

  // Mission-specific
  objective     String              // Measurable goal
  scope         String?             // What's included/excluded
  constraints   String?             // Technical limits
  profile       MissionProfile      // SIMPLE | STANDARD | COMPLEX

  // Execution state
  status        MissionStatus       // PENDING | IN_PROGRESS | COMPLETED | FAILED | BLOCKED
  currentPhase  Int       @default(0)
  totalPhases   Int       @default(1)

  // Metadata
  missionPath   String?             // .claude/missions/<name>/
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  completedAt   DateTime?

  // Relations
  phases        Phase[]

  @@index([status])
  @@index([createdAt])
}

// === PHASE (new entity) ===
model Phase {
  id            String    @id @default(cuid())
  missionId     String
  mission       Mission   @relation(fields: [missionId], references: [id], onDelete: Cascade)

  number        Int                 // Phase sequence (1, 2, 3...)
  name          String
  description   String?

  // Execution
  status        PhaseStatus         // PENDING | IN_PROGRESS | COMPLETED | FAILED
  isParallel    Boolean   @default(false)  // Can tasks run in parallel?

  // Timing
  startedAt     DateTime?
  completedAt   DateTime?

  // Relations
  tasks         Task[]

  @@unique([missionId, number])
  @@index([missionId])
}

// === TASK (extended) ===
model Task {
  id            String    @id @default(cuid())

  // Can belong to Phase (new) OR Workflow (legacy)
  phaseId       String?
  phase         Phase?    @relation(fields: [phaseId], references: [id], onDelete: Cascade)
  workflowId    String?             // Legacy support

  // Caller context (NEW)
  callerType    CallerType          // ORCHESTRATOR | SUBAGENT
  agentName     String?             // e.g., "feature-implementer"
  agentPrompt   String?             // The prompt given to sub-agent (for replay)

  // ... existing fields (name, goal, status, etc.)

  @@index([phaseId])
  @@index([callerType])
  @@index([agentName])
}

// === ENUMS ===
enum MissionProfile {
  SIMPLE      // 2 phases
  STANDARD    // 3 phases
  COMPLEX     // 4+ phases, parallel
}

enum MissionStatus {
  PENDING
  IN_PROGRESS
  COMPLETED
  FAILED
  BLOCKED     // Waiting for human intervention
}

enum PhaseStatus {
  PENDING
  IN_PROGRESS
  COMPLETED
  FAILED
}

enum CallerType {
  ORCHESTRATOR
  SUBAGENT
}
```

---

## MCP Tools (Simplified Set)

**Design Principle**: Minimal but complete. 8 tools instead of 13.

### Overview

| Category | Tool | Purpose | Caller |
|----------|------|---------|--------|
| **Lifecycle** | `start_mission` | Create mission container | Orchestrator |
| | `start_task` | Start task + git snapshot + auto-create phase | Orchestrator/Sub-agent |
| | `complete_task` | Finalize task + git diff + auto-close phase | Sub-agent |
| | `complete_mission` | Finalize entire mission | Orchestrator |
| **Logging** | `log_decision` | Architectural choice | Sub-agent |
| | `log_issue` | Problem/blocker | Sub-agent |
| | `log_milestone` | Progress update | Sub-agent |
| **Query** | `get_context` | Unified query (decisions, progress, blockers) | Sub-agent |

### Tool Details

#### start_mission (replaces start_workflow)
```typescript
Input: {
  name: string,
  objective: string,           // Measurable goal
  profile?: "simple" | "standard" | "complex",
  total_phases?: number,       // Expected phases (for progress tracking)
  scope?: string,
  constraints?: string
}
Output: { mission_id, created_at }
```

#### start_task (extended)
```typescript
Input: {
  mission_id: string,
  phase: number,               // Phase number (1, 2, 3...)
  phase_name?: string,         // Name for phase (used on first task of phase)
  caller_type: "orchestrator" | "subagent",
  agent_name?: string,         // e.g., "feature-implementer"
  name: string,
  goal: string,
  areas?: string[]             // Code areas affected
}
Output: { task_id, phase_id, snapshot_id, started_at }
// Note: Phase auto-created if doesn't exist for this phase number
```

#### complete_task (extended)
```typescript
Input: {
  task_id: string,
  status: "success" | "partial_success" | "failed",
  outcome: {
    summary: string,
    achievements?: string[],
    limitations?: string[],
    next_steps?: string[]
  },
  phase_complete?: boolean     // Mark phase as done (default: false)
}
Output: { task_id, duration_seconds, files_changed, phase_status }
// Note: If phase_complete=true, Phase status set to COMPLETED
```

#### complete_mission
```typescript
Input: {
  mission_id: string,
  status: "completed" | "failed" | "partial",
  summary: string,
  achievements?: string[],
  limitations?: string[]
}
Output: { mission_id, total_duration, total_tasks, files_changed }
```

#### log_decision, log_issue, log_milestone
Unchanged from original MCP tracker.

#### get_context (unified query)
```typescript
Input: {
  mission_id: string,
  include: ("decisions" | "milestones" | "blockers" | "phase_summary" | "tasks")[],
  filter?: {
    phase?: number,            // Filter by phase
    agent?: string,            // Filter by agent name
    since?: string             // ISO timestamp
  }
}
Output: {
  decisions?: Decision[],
  milestones?: Milestone[],
  blockers?: Issue[],          // Issues with requiresHumanReview=true
  phase_summary?: { phase, status, tasks_count, duration },
  tasks?: TaskSummary[]
}
```

### Backward Compatibility

| Old Tool | New Behavior |
|----------|--------------|
| `start_workflow` | Alias for `start_mission` (deprecated) |
| All others | Unchanged or extended (non-breaking) |

### Calls Per Task

Typical sub-agent flow: **3-5 MCP calls**
```
start_task      → 1 call
get_context     → 0-1 call (if needs prior decisions)
log_*           → 0-3 calls
complete_task   → 1 call
─────────────────────────
Total: 2-6 calls (usually 3-4)
```

---

## Agent Workflow (Simplified)

### Orchestrator Flow

```
1. User: "Create a mission for <objective>"
   → Invokes mission-architect agent
   → Creates .claude/missions/<name>/{mission.md, workflow.md, start.md}

2. User: "Execute the mission" (or runs start.md)
   → Orchestrator starts

3. Orchestrator:
   a. start_mission({name, objective, profile, total_phases: 3})

   b. FOR each phase:
      - Launch sub-agent with prompt (includes mission_id, phase number)
      - Wait for sub-agent to complete
      - (Phase auto-managed by sub-agent's complete_task with phase_complete=true)

   c. complete_mission({mission_id, status, summary})
```

### Sub-Agent Flow

```
1. Sub-agent receives prompt with mission_id and phase number

2. Sub-agent:
   a. start_task({
        mission_id,
        phase: 2,
        phase_name: "Implementation",  // Only needed for first task of phase
        caller_type: "subagent",
        agent_name: "feature-implementer",
        name: "Implement auth module",
        goal: "...",
        areas: ["src/auth"]
      })
      // → Phase auto-created if first task for phase 2

   b. get_context({
        mission_id,
        include: ["decisions", "blockers"],
        filter: { phase: 1 }  // Get decisions from previous phase
      })

   c. Do work...
      - log_decision() for architectural choices
      - log_milestone() for progress updates
      - log_issue() if blocked

   d. complete_task({
        task_id,
        status: "success",
        outcome: { summary: "...", achievements: [...] },
        phase_complete: true  // This is the last task of the phase
      })
      // → Phase auto-marked as COMPLETED
```

### Minimal Flow (Single Task per Phase)

For simple missions, each phase = 1 task:
```
Orchestrator: start_mission
  └─ Sub-agent 1: start_task(phase:1) → work → complete_task(phase_complete:true)
  └─ Sub-agent 2: start_task(phase:2) → work → complete_task(phase_complete:true)
  └─ Sub-agent 3: start_task(phase:3) → work → complete_task(phase_complete:true)
Orchestrator: complete_mission
```
**Total MCP calls**: 2 (orchestrator) + 2×3 (sub-agents) = **8 calls** for entire mission

---

## WebUI Enhancements

### New Views

1. **Missions List** (`/`)
   - Cards showing active missions
   - Progress bar (phase X of Y)
   - Status badges

2. **Mission Detail** (`/mission/[id]`)
   - Phase timeline (vertical)
   - Expandable phases → tasks
   - Agent activity log
   - Blockers panel

3. **Task Detail** (`/task/[id]`)
   - Existing functionality
   - + Agent context (caller_type, agent_name)
   - + Link to parent phase/mission

### Real-time Updates

```
WebSocket events:
- mission:created
- mission:updated
- mission:completed
- phase:created (auto, when first task of phase starts)
- phase:completed (auto, when task with phase_complete=true)
- task:created (with agent context)
- task:updated
- blocker:created (issue with requiresHumanReview=true)
```

---

## Installation Script

### `scripts/setup.sh`

```bash
#!/bin/bash

echo "╔══════════════════════════════════════╗"
echo "║     Mission Control - Setup          ║"
echo "╚══════════════════════════════════════╝"

# 1. Prerequisites check
check_prerequisites() {
  echo "Checking prerequisites..."
  command -v node >/dev/null || { echo "Node.js required"; exit 1; }
  command -v pnpm >/dev/null || { echo "pnpm required"; exit 1; }
  [[ $(node -v | cut -d. -f1 | tr -d v) -ge 20 ]] || { echo "Node 20+ required"; exit 1; }
  echo "✓ Prerequisites OK"
}

# 2. Install dependencies
install_deps() {
  echo "Installing dependencies..."
  pnpm install
  echo "✓ Dependencies installed"
}

# 3. Build project
build_project() {
  echo "Building project..."
  pnpm build
  echo "✓ Build complete"
}

# 4. Database setup
setup_database() {
  echo "Setting up database..."
  pnpm prisma migrate deploy
  echo "✓ Database ready"
}

# 5. Create symlinks
create_symlinks() {
  echo "Creating ~/.claude/ symlinks..."
  ./scripts/symlink.sh
  echo "✓ Symlinks created"
}

# 6. Configure MCP
configure_mcp() {
  echo "Configuring MCP server..."
  # Generate .mcp.json in user's project
  # Interactive: ask for project path
  echo "✓ MCP configured"
}

# 7. Verify connection
verify_mcp() {
  echo "Verifying MCP connection..."
  ./scripts/verify-mcp.sh
  echo "✓ MCP connection verified"
}

# Run all steps
check_prerequisites
install_deps
build_project
setup_database
create_symlinks
configure_mcp
verify_mcp

echo ""
echo "════════════════════════════════════════"
echo "  Setup complete!"
echo "  Run: 'Create a mission for...' in Claude Code"
echo "════════════════════════════════════════"
```

---

## Migration Path

### From mission-system (memory.md)

1. Existing missions continue to work (memory.md fallback)
2. New missions use MCP exclusively
3. Optional: migration script to import memory.md → DB

### From mcpAgentTracker (Workflow)

1. Existing workflows accessible as "legacy" missions
2. No breaking changes to existing tools
3. New tools added alongside existing ones

---

## Success Criteria

### V1 Complete When:

- [ ] Repos merged into single `mission-control`
- [ ] Schema extended with Mission, Phase, CallerType
- [ ] 8 MCP tools working:
  - [ ] `start_mission` (replaces start_workflow)
  - [ ] `start_task` (extended with phase, caller_type, agent_name)
  - [ ] `complete_task` (extended with phase_complete)
  - [ ] `complete_mission` (new)
  - [ ] `log_decision`, `log_issue`, `log_milestone` (unchanged)
  - [ ] `get_context` (unified query)
- [ ] Phase auto-management working (create on first task, close on phase_complete)
- [ ] mission-architect updated for MCP
- [ ] WebUI shows missions → phases → tasks hierarchy
- [ ] Setup script works end-to-end
- [ ] Documentation updated

---

## Future Enhancements (Post-V1)

- Mission templates (pre-built workflows)
- Mission replay (re-run with different parameters)
- Cross-mission analytics
- Export to markdown (for archives)
- Multi-project dashboard
- Agent performance metrics

---

**Version**: 0.1 (Draft)
**Created**: December 2024
