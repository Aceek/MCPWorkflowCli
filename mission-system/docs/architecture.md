# Workflow System Architecture

Multi-agent workflow orchestration via MCP tools.

## Directory Structure

```
~/.claude/
├── docs/workflow-system/     # This documentation
│   ├── architecture.md
│   ├── usage.md
│   └── templates/
└── agents/
    └── workflow-architect.md

/project/.claude/
├── CLAUDE.md                # Updated with active workflow
└── workflows/<name>/
    ├── definition.md        # Objectives + workflow_id
    ├── workflow.md          # Phases + agents
    └── start.md             # Executable prompt
```

## Core Concepts

### MCP Access

**Subagents CAN call MCP tools directly.** Full access to all `mcp__mission-control__*` tools.

| Caller | MCP Access | Role |
|--------|------------|------|
| Orchestrator | ✅ Full | Coordinates phases, monitors progress |
| Subagent | ✅ Full | Manages own task lifecycle + logs progress |

### State Management
All state via MCP tools (no file-based memory):

| State | Tool | Caller |
|-------|------|--------|
| Workflow lifecycle | `start_workflow`, `complete_workflow` | Orchestrator |
| Phase lifecycle | `start_phase`, `complete_phase` | Orchestrator |
| Task lifecycle | `start_task`, `complete_task` | Subagent |
| Decisions | `log_decision` | Subagent |
| Progress | `log_milestone` | Subagent |
| Blockers | `log_issue` | Subagent |
| Query | `get_context` | Both |

### Orchestrator
- Reads definition.md + workflow.md at start
- Creates phases via `start_phase()` before launching subagents
- Launches sub-agents via Task tool with workflow_id + phase_id
- Monitors progress via `get_context()`
- Completes phases via `complete_phase()` after all tasks done
- Handles blockers requiring human review
- Calls `complete_workflow()` when all phases done
- NEVER delegates orchestration

### Sub-Agents
- Isolated context per agent
- **Full MCP access** - manage own task lifecycle
- Call `start_task()` → do work → `log_*()` → `complete_task()`
- Can query context via `get_context()`
- Focus on actual work (analysis, implementation, review)

### Direct Pattern

```
Orchestrator                          Subagent
     │                                    │
     ├── start_workflow() → workflow_id   │
     │                                    │
     ├── start_phase() → phase_id         │
     │                                    │
     ├── Task tool (workflow_id + phase_id) ──>│
     │                                    ├── start_task({phase_id}) → task_id
     │                                    ├── [does work]
     │                                    ├── log_milestone() (real-time)
     │                                    ├── log_decision() (each choice)
     │                                    ├── log_issue() (if blockers)
     │                                    └── complete_task()
     │<── agent done ─────────────────────┤
     │                                    │
     ├── get_context() (monitor)          │
     ├── complete_phase()                 │
     │                                    │
     └── complete_workflow()              │
```

### subagent_type Rules

| Purpose | Type | Reason |
|---------|------|--------|
| File-writing | `general-purpose` | Needs Write/Edit tools |
| Read-only | `Explore` | Built-in, faster |

## Execution Flow

```
1. Read definition.md, workflow.md
2. start_workflow() → workflow_id
3. FOR each phase:
   a. start_phase({workflow_id, number, name}) → phase_id
   b. Launch sub-agent(s) via Task tool (pass workflow_id + phase_id)
   c. Subagent manages own MCP calls (start_task → log_* → complete_task)
   d. Monitor via get_context({include: ["tasks", "blockers"]})
   e. Check blockers
   f. complete_phase({phase_id, status})
4. IF blocker → STOP, request human help
5. complete_workflow()
```

### Parallel Execution
```yaml
parallel: true   # Multiple Task calls in single message
parallel: false  # Sequential (default)
```

### Context Management
| Condition | Action |
|-----------|--------|
| >5 phases | /clear between major phases |
| After /clear | Re-read definition.md |
| Need previous context | get_context with phase filter |

## workflow.md Schema

```yaml
name: workflow-name
phases:
  - id: phase-1
    number: 1
    name: Analysis
    agents:
      - type: analyzer
        subagent_type: "general-purpose"
        scope: what this agent handles
    parallel: false
    outputs:
      - report.md
    completion: all agents success

  - id: phase-2
    number: 2
    requires: 1
    checkpoint: human  # Optional pause
```

## Validation Rules

- All agents must exist
- No circular dependencies
- No overlapping scopes in parallel
- File-writing agents = `general-purpose`
- All phases need `number` field

## CLAUDE.md Integration

Workflow-architect adds to project CLAUDE.md:

```markdown
## Active Workflow
Workflow: <name>
ID: `<workflow_id>`
Path: .claude/workflows/<name>/

Commands:
- "continue workflow" → Resume
- "workflow status" → Query
- "abort workflow" → Fail
```
