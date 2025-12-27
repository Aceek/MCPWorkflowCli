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

### State Management
All state via MCP tools (no file-based memory):

| State | Tool |
|-------|------|
| Workflow lifecycle | `start_workflow`, `complete_workflow` |
| Task lifecycle | `start_task`, `complete_task` |
| Decisions | `log_decision` |
| Progress | `log_milestone` |
| Blockers | `log_issue` |
| Query | `get_context` |

### Orchestrator
- Reads definition.md + workflow.md at start
- Executes phases sequentially (or parallel)
- Launches sub-agents via Task tool
- Tracks progress via MCP
- NEVER delegates orchestration

### Sub-Agents
- Isolated context per agent
- Return summary to orchestrator
- Use MCP for state tracking
- Query previous decisions via `get_context`

### subagent_type Rules

| Purpose | Type | Reason |
|---------|------|--------|
| File-writing | `general-purpose` | Needs Write/Edit tools |
| Read-only | `Explore` | Built-in, faster |

## Execution Flow

```
1. Read definition.md, workflow.md
2. FOR each phase:
   a. start_task (orchestrator)
   b. Launch sub-agent(s)
   c. complete_task (phase_complete: true)
   d. Check blockers
3. IF blocker → STOP
4. complete_workflow
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
| Sub-agent needs context | get_context with phase filter |

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
      - log_decision: key choices
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
