# MCP Protocol

## Overview

Mission Control exposes **9 MCP tools** for mission orchestration and workflow tracking.

### Tool Summary

| Tool | Role | Frequency | Required |
|------|------|-----------|----------|
| `start_mission` | Initialize mission with phases | 1x per mission | Yes |
| `complete_mission` | Finalize mission with summary | 1x per mission | Yes |
| `get_context` | Query mission state | 0-Nx per mission | No |
| `start_task` | Start task + Git snapshot | 1x per task | Yes |
| `complete_task` | Finalize task + Git diff | 1x per task | Yes |
| `log_decision` | Log architectural decision | 0-3x per task | No |
| `log_issue` | Log problem/blocker | 0-3x per task | No |
| `log_milestone` | Real-time UI update | 0-5x per task | No |
| `start_workflow` | Legacy alias | - | Legacy |

**Promise:** Max 3-6 MCP calls per task (no context flooding).

---

## 1. start_mission

**Role:** Initialize a new mission for multi-phase orchestration.

### Input Schema

```json
{
  "name": "start_mission",
  "description": "Initialize a new mission tracking session for multi-phase orchestration",
  "inputSchema": {
    "type": "object",
    "properties": {
      "name": {
        "type": "string",
        "description": "Short mission name (e.g., 'Implement auth system')"
      },
      "objective": {
        "type": "string",
        "description": "Measurable goal for the mission"
      },
      "description": {
        "type": "string",
        "description": "Detailed description of the mission"
      },
      "profile": {
        "type": "string",
        "enum": ["simple", "standard", "complex"],
        "description": "Mission complexity profile (simple=2 phases, standard=3, complex=4+)"
      },
      "total_phases": {
        "type": "number",
        "description": "Expected number of phases (for progress tracking)"
      },
      "scope": {
        "type": "string",
        "description": "What's included/excluded from this mission"
      },
      "constraints": {
        "type": "string",
        "description": "Technical constraints or limitations"
      }
    },
    "required": ["name", "objective"]
  }
}
```

### Output

```json
{
  "mission_id": "clx123abc",
  "profile": "STANDARD",
  "total_phases": 3,
  "created_at": "2025-01-15T10:00:00Z"
}
```

### Example

```typescript
const result = await mcp.call('start_mission', {
  name: 'Auth System Implementation',
  objective: 'Add JWT-based authentication with role-based access',
  profile: 'standard',
  scope: 'Backend auth only, no UI changes',
  constraints: 'Must use existing user table'
})

// result.mission_id = "clx123abc"
```

---

## 2. complete_mission

**Role:** Finalize a mission and aggregate metrics.

### Input Schema

```json
{
  "name": "complete_mission",
  "description": "Finalize a mission and aggregate metrics",
  "inputSchema": {
    "type": "object",
    "properties": {
      "mission_id": {
        "type": "string",
        "description": "The mission ID to complete"
      },
      "status": {
        "type": "string",
        "enum": ["completed", "failed", "partial"],
        "description": "Final status of the mission"
      },
      "summary": {
        "type": "string",
        "description": "Summary of what was accomplished"
      },
      "achievements": {
        "type": "array",
        "items": { "type": "string" },
        "description": "List of achievements during the mission"
      },
      "limitations": {
        "type": "array",
        "items": { "type": "string" },
        "description": "List of limitations or issues encountered"
      }
    },
    "required": ["mission_id", "status", "summary"]
  }
}
```

### Output

```json
{
  "mission_id": "clx123abc",
  "status": "completed",
  "summary": "Auth system implemented successfully",
  "achievements": ["JWT middleware", "Role-based access", "Token refresh"],
  "limitations": ["OAuth integration deferred"],
  "metrics": {
    "total_phases": 3,
    "total_tasks": 8,
    "total_duration_seconds": 3600,
    "total_duration_minutes": 60,
    "files_changed": 15
  },
  "completed_at": "2025-01-15T11:00:00Z"
}
```

---

## 3. get_context

**Role:** Query mission state for sub-agents (decisions, blockers, phases, tasks).

### Input Schema

```json
{
  "name": "get_context",
  "description": "Retrieve mission context (decisions, milestones, blockers, phases, tasks)",
  "inputSchema": {
    "type": "object",
    "properties": {
      "mission_id": {
        "type": "string",
        "description": "The mission ID to query"
      },
      "include": {
        "type": "array",
        "items": {
          "type": "string",
          "enum": ["decisions", "milestones", "blockers", "phase_summary", "tasks"]
        },
        "description": "What context to include in the response"
      },
      "filter": {
        "type": "object",
        "properties": {
          "phase": {
            "type": "number",
            "description": "Filter by phase number"
          },
          "agent": {
            "type": "string",
            "description": "Filter by agent name"
          },
          "since": {
            "type": "string",
            "description": "Filter by timestamp (ISO format)"
          }
        }
      }
    },
    "required": ["mission_id", "include"]
  }
}
```

### Output

```json
{
  "mission_id": "clx123abc",
  "mission_name": "Auth System Implementation",
  "mission_status": "IN_PROGRESS",
  "current_phase": 2,
  "total_phases": 3,
  "phase_summary": [
    {
      "phase_number": 1,
      "name": "Setup",
      "status": "COMPLETED",
      "tasks_count": 3,
      "duration_seconds": 1200
    },
    {
      "phase_number": 2,
      "name": "Implementation",
      "status": "IN_PROGRESS",
      "tasks_count": 2,
      "duration_seconds": 600
    }
  ],
  "decisions": [
    {
      "id": "dec123",
      "category": "LIBRARY_CHOICE",
      "question": "Which JWT library?",
      "chosen": "jsonwebtoken",
      "reasoning": "Most mature, good TypeScript support"
    }
  ],
  "blockers": []
}
```

### Example

```typescript
// Get phase summary and blockers
const context = await mcp.call('get_context', {
  mission_id: 'clx123abc',
  include: ['phase_summary', 'blockers', 'decisions'],
  filter: { phase: 2 }
})
```

---

## 4. start_task

**Role:** Start a task and create a Git snapshot. Supports both legacy workflows and mission-based orchestration.

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
        "description": "Parent workflow ID (legacy mode)"
      },
      "parent_task_id": {
        "type": "string",
        "description": "Parent task ID (null if top-level task)"
      },
      "mission_id": {
        "type": "string",
        "description": "Mission ID (for mission-based orchestration)"
      },
      "phase": {
        "type": "number",
        "description": "Phase number (1, 2, 3...). Phase is auto-created if it does not exist."
      },
      "phase_name": {
        "type": "string",
        "description": "Name for the phase (used when auto-creating)"
      },
      "caller_type": {
        "type": "string",
        "enum": ["orchestrator", "subagent"],
        "description": "Who is calling this task"
      },
      "agent_name": {
        "type": "string",
        "description": "Name of the agent (e.g., 'feature-implementer')"
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
        "items": { "type": "string" },
        "description": "Code areas this task will touch (e.g., ['auth', 'api'])"
      }
    },
    "required": ["name", "goal"]
  }
}
```

### Output

```json
{
  "task_id": "clx456def",
  "snapshot_id": "abc123git",
  "snapshot_type": "git",
  "started_at": "2025-01-15T10:05:00Z",
  "phase_id": "phase123",
  "phase_created": true,
  "caller_type": "orchestrator",
  "agent_name": null
}
```

### Examples

**Mission-based orchestration (orchestrator):**
```typescript
const result = await mcp.call('start_task', {
  mission_id: 'clx123abc',
  phase: 1,
  phase_name: 'Setup Phase',
  caller_type: 'orchestrator',
  name: 'Initialize project structure',
  goal: 'Set up auth module directory structure',
  areas: ['auth']
})
```

**Mission-based orchestration (sub-agent):**
```typescript
const result = await mcp.call('start_task', {
  mission_id: 'clx123abc',
  phase: 2,
  caller_type: 'subagent',
  agent_name: 'feature-implementer',
  name: 'Implement JWT middleware',
  goal: 'Create middleware to verify JWT tokens',
  areas: ['auth', 'middleware']
})
```

**Legacy workflow mode:**
```typescript
const result = await mcp.call('start_task', {
  workflow_id: 'wf123',
  name: 'Implement JWT middleware',
  goal: 'Create middleware to verify JWT tokens',
  areas: ['auth', 'middleware']
})
```

### Git Snapshot Logic (CRITICAL)

At `start_task`, the MCP:

1. Checks if project is a Git repo
2. **If Git:** Stores current commit hash
3. **If not Git:** Creates checksum-based snapshot

```typescript
const git = simpleGit()
const isGitRepo = await git.checkIsRepo()

if (isGitRepo) {
  const currentHash = await git.revparse(['HEAD'])
  snapshotType = 'git'
  snapshotData = { gitHash: currentHash.trim() }
} else {
  snapshotType = 'checksum'
  snapshotData = { checksums: await createChecksumSnapshot() }
}
```

---

## 5. complete_task (MOST CRITICAL)

**Role:** Finalize a task. Automatically calculates modified files via **robust Git diff**.

### Input Schema

```json
{
  "name": "complete_task",
  "description": "Complete a task and compute file changes via Git diff",
  "inputSchema": {
    "type": "object",
    "properties": {
      "task_id": {
        "type": "string",
        "description": "Task ID to complete"
      },
      "status": {
        "type": "string",
        "enum": ["success", "partial_success", "failed"],
        "description": "Final status of the task"
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
            "items": { "type": "string" },
            "description": "Concrete achievements (empty array if none)"
          },
          "limitations": {
            "type": "array",
            "items": { "type": "string" },
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
            "items": { "type": "string" },
            "description": "Suggested next steps (optional)"
          }
        },
        "required": ["summary"]
      },
      "metadata": {
        "type": "object",
        "properties": {
          "packages_added": { "type": "array", "items": { "type": "string" } },
          "packages_removed": { "type": "array", "items": { "type": "string" } },
          "commands_executed": { "type": "array", "items": { "type": "string" } },
          "tests_status": {
            "type": "string",
            "enum": ["passed", "failed", "not_run"]
          },
          "tokens_input": { "type": "number" },
          "tokens_output": { "type": "number" }
        }
      },
      "phase_complete": {
        "type": "boolean",
        "description": "Set to true to mark the current phase as complete"
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
  },
  "phase_status": "completed",
  "phase_number": 1
}
```

### Robust Git Diff Logic (CRITICAL)

The MCP calculates modified files using the **UNION of 2 diffs**:

```typescript
const task = await prisma.task.findUnique({ where: { id: task_id } })
const startHash = task.snapshotData.gitHash  // Hash from start_task

// ========================================
// DIFF 1: Commits made during the task
// git diff <start_hash> HEAD --name-status
// ========================================
const committedDiff = await git.diff([
  startHash,
  'HEAD',
  '--name-status'
])

// ========================================
// DIFF 2: Uncommitted working tree
// git diff HEAD --name-status
// ========================================
const workingTreeDiff = await git.diff([
  'HEAD',
  '--name-status'
])

// ========================================
// UNION of both diffs = ABSOLUTE TRUTH
// ========================================
const allChanges = parseDiffOutput(committedDiff)
                    .concat(parseDiffOutput(workingTreeDiff))
```

**Concrete Example:**

```
10:00 → start_task (snapshot: abc123)
10:05 → Agent modifies auth.ts, database.ts
10:10 → Agent commits → new hash def456
10:15 → Agent modifies config.ts (uncommitted)
10:20 → complete_task

Diff 1 (abc123..def456): auth.ts, database.ts
Diff 2 (def456..HEAD)  : config.ts
Union                  : auth.ts, database.ts, config.ts ✅
```

### Phase Completion

When `phase_complete: true`:
1. Phase status updated to `COMPLETED`
2. Phase `completedAt` timestamp set
3. Mission `currentPhase` incremented
4. WebSocket events emitted

---

## 6. log_decision

**Role:** Log an important architectural decision (optional).

### Input Schema

```json
{
  "name": "log_decision",
  "description": "Log an important architectural decision",
  "inputSchema": {
    "type": "object",
    "properties": {
      "task_id": { "type": "string" },
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
        "items": { "type": "string" },
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

### When to Use

- Library choice
- Architecture decision
- Significant trade-off
- Technical workaround

### When NOT to Use

- Trivial decisions (variable naming)
- Obvious choices without alternatives

---

## 7. log_issue

**Role:** Log a problem encountered during execution (optional).

### Input Schema

```json
{
  "name": "log_issue",
  "description": "Log an issue encountered during execution",
  "inputSchema": {
    "type": "object",
    "properties": {
      "task_id": { "type": "string" },
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

### Issue Types

| Type | Description |
|------|-------------|
| `documentation_gap` | Missing/outdated documentation |
| `bug_encountered` | Bug in a library/code |
| `dependency_conflict` | Version conflicts |
| `unclear_requirement` | Vague specification |
| `other` | Other problem |

**Note:** Issues with `requires_human_review: true` appear as blockers in `get_context`.

---

## 8. log_milestone

**Role:** Real-time UI update (lightweight, fire-and-forget).

### Input Schema

```json
{
  "name": "log_milestone",
  "description": "Log a milestone for real-time UI updates",
  "inputSchema": {
    "type": "object",
    "properties": {
      "task_id": { "type": "string" },
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

### Best Practices

- Max 5 milestones per task
- Short, informative messages
- Progress is optional (useful for progress bar UI)

---

## 9. start_workflow (Legacy)

**Role:** Legacy alias for backward compatibility.

This tool creates a Workflow (not a Mission) and is maintained for backward compatibility with existing integrations. New implementations should use `start_mission` instead.

---

## Typical Usage Flow

### Mission-Based Flow

```typescript
// 1. Initialize mission
const { mission_id } = await mcp.call('start_mission', {
  name: 'Auth System',
  objective: 'Implement JWT authentication',
  profile: 'standard'
})

// 2. Start Phase 1 task (auto-creates phase)
const { task_id } = await mcp.call('start_task', {
  mission_id,
  phase: 1,
  phase_name: 'Setup',
  caller_type: 'orchestrator',
  name: 'Setup JWT middleware',
  goal: 'Create middleware to verify JWT tokens',
  areas: ['auth', 'middleware']
})

// 3. (Optional) Log decision
await mcp.call('log_decision', {
  task_id,
  category: 'library_choice',
  question: 'Which JWT library?',
  options_considered: ['jsonwebtoken', 'jose'],
  chosen: 'jsonwebtoken',
  reasoning: 'More mature and documented'
})

// 4. (Optional) Real-time updates
await mcp.call('log_milestone', {
  task_id,
  message: 'Installing dependencies...',
  progress: 50
})

// 5. Complete task and phase
await mcp.call('complete_task', {
  task_id,
  status: 'success',
  outcome: {
    summary: 'JWT middleware created and tested successfully',
    achievements: ['Middleware verifies JWT signature', 'Tests pass (100% coverage)'],
    limitations: ['Refresh tokens not implemented (future feature)']
  },
  metadata: {
    packages_added: ['jsonwebtoken', '@types/jsonwebtoken'],
    tests_status: 'passed'
  },
  phase_complete: true  // Mark Phase 1 as done
})

// 6. Continue with Phase 2...

// 7. Complete mission
await mcp.call('complete_mission', {
  mission_id,
  status: 'completed',
  summary: 'Auth system fully implemented',
  achievements: ['JWT auth', 'Role-based access', 'Token refresh'],
  limitations: ['OAuth deferred to next sprint']
})
```

---

## Enums and Type Safety

The MCP strictly validates enums to prevent typos.

### Task Status

```typescript
// Input
status: "success" | "partial_success" | "failed"

// Stored in DB (Prisma enum)
enum TaskStatus {
  IN_PROGRESS
  SUCCESS
  PARTIAL_SUCCESS
  FAILED
}
```

### Mission Status

```typescript
enum MissionStatus {
  PENDING
  IN_PROGRESS
  COMPLETED
  FAILED
  BLOCKED
}
```

### Phase Status

```typescript
enum PhaseStatus {
  PENDING
  IN_PROGRESS
  COMPLETED
  FAILED
}
```

### Caller Type

```typescript
// Input
caller_type: "orchestrator" | "subagent"

// Stored in DB
enum CallerType {
  ORCHESTRATOR
  SUBAGENT
}
```

---

## WebSocket Events

The MCP emits real-time events for the WebUI:

| Event | Trigger |
|-------|---------|
| `mission:created` | `start_mission` |
| `mission:updated` | `complete_mission`, phase changes |
| `phase:created` | First task of a phase |
| `phase:updated` | `complete_task` with `phase_complete: true` |
| `task:created` | `start_task` |
| `task:updated` | `complete_task` |
| `workflow:created` | `start_workflow` (legacy) |
| `workflow:updated` | Task status changes |

---

**This document defines the complete MCP protocol.**
For implementation details, see:
- [Architecture](./architecture.md): Project structure
- [Database](./database.md): Prisma schema
