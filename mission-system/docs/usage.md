# Mission System Usage

MCP-based orchestration for multi-agent workflows.

## Quick Reference

| Caller | Required Tools | Optional Tools |
|--------|----------------|----------------|
| Orchestrator | `start_task`, `complete_task`, `complete_mission` | `get_context` |
| Sub-agent | `start_task`, `complete_task` | `get_context`, `log_decision`, `log_milestone`, `log_issue` |

## Orchestrator Protocol

### 1. Setup
```
Read .claude/missions/<name>/mission.md  → mission_id, objectives
Read .claude/missions/<name>/workflow.md → phases, agents
```

### 2. Phase Loop
```
FOR each phase:
  1. start_task({caller_type: "orchestrator", phase: N, ...})
  2. Launch sub-agent via Task tool
  3. Wait for completion
  4. complete_task({phase_complete: true})
  5. get_context({include: ["blockers"]})
  6. IF blockers → STOP, request human help
```

### 3. Completion
```
complete_mission({
  mission_id, status: "completed",
  summary: "...", achievements: [...]
})
```

## Sub-Agent Protocol

### Minimal (2 calls)
```
start_task({...}) → task_id
[work]
complete_task({task_id, status, outcome, phase_complete: true})
```

### Standard (3-5 calls)
```
start_task({...}) → task_id
get_context({include: ["decisions"], filter: {phase: N-1}})
[work]
  log_decision({...}) // key choices
  log_milestone({...}) // progress
complete_task({...})
```

## MCP Tool Schemas

### start_task

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `mission_id` | string | yes | Mission identifier |
| `phase` | number | yes | Phase number (auto-creates) |
| `phase_name` | string | no | Name for auto-created phase |
| `caller_type` | string | yes | `orchestrator` or `subagent` |
| `agent_name` | string | subagent | Agent identifier |
| `name` | string | yes | Task name |
| `goal` | string | yes | Task goal |
| `areas` | string[] | no | Code paths affected |

**Returns**: `{ task_id, phase_id, snapshot_id, started_at }`

### complete_task

| Field | Type | Required |
|-------|------|----------|
| `task_id` | string | yes |
| `status` | enum | yes | `success`, `partial_success`, `failed` |
| `outcome.summary` | string | yes |
| `outcome.achievements` | string[] | no |
| `outcome.limitations` | string[] | no |
| `outcome.next_steps` | string[] | no |
| `phase_complete` | bool | no | Mark phase done |

**Returns**: `{ task_id, duration_seconds, files_changed }`

### get_context

| Field | Type | Required |
|-------|------|----------|
| `mission_id` | string | yes |
| `include` | string[] | yes | `decisions`, `milestones`, `blockers`, `phase_summary`, `tasks` |
| `filter.phase` | number | no |
| `filter.agent` | string | no |

### log_decision

| Field | Type | Required |
|-------|------|----------|
| `task_id` | string | yes |
| `category` | enum | yes | `architecture`, `library`, `approach`, `scope` |
| `question` | string | yes |
| `chosen` | string | yes |
| `reasoning` | string | yes |

### log_milestone

| Field | Type | Required |
|-------|------|----------|
| `task_id` | string | yes |
| `message` | string | yes |
| `progress` | number | no | 0-100 |

### log_issue

| Field | Type | Required |
|-------|------|----------|
| `task_id` | string | yes |
| `type` | enum | yes | `blocker`, `bug`, `dependency`, `unclear_requirement` |
| `description` | string | yes |
| `severity` | string | no | `high`, `medium`, `low` |
| `requiresHumanReview` | bool | no | Creates blocker |

### complete_mission

| Field | Type | Required |
|-------|------|----------|
| `mission_id` | string | yes |
| `status` | enum | yes | `completed`, `failed`, `partial` |
| `summary` | string | yes |
| `achievements` | string[] | no |
| `limitations` | string[] | no |

## Prompt Templates

### Sub-Agent (Minimal)
```markdown
## MCP
Mission: `{mission_id}` | Phase: {N} | Agent: {name}

START: `start_task({mission_id, phase: {N}, caller_type: "subagent", agent_name: "{name}", name: "...", goal: "..."})`
END: `complete_task({task_id, status: "success", outcome: {summary: "..."}, phase_complete: true})`
```

### Sub-Agent (Full)
```markdown
## MCP Integration

**Context**: Mission `{mission_id}`, Phase {N}, Agent: {agent_name}

### At Start
start_task({
  mission_id: "{mission_id}",
  phase: {N},
  caller_type: "subagent",
  agent_name: "{agent_name}",
  name: "{task_name}",
  goal: "{task_goal}",
  areas: ["{paths}"]
})

### During Work
- log_decision({task_id, category, question, chosen, reasoning})
- log_milestone({task_id, message, progress})
- log_issue({task_id, type, description, requiresHumanReview: true}) // if blocked

### At End
complete_task({
  task_id: "{task_id}",
  status: "success",
  outcome: { summary: "...", achievements: [...] },
  phase_complete: true
})
```

## Error Handling

### Blocker Detection
1. Sub-agent calls `log_issue` with `requiresHumanReview: true`
2. Sub-agent returns error summary to orchestrator
3. Orchestrator detects via `get_context({include: ["blockers"]})`
4. Orchestrator STOPS and requests human intervention

### Phase Failure
```
complete_task({
  task_id, status: "failed",
  outcome: { summary: "Failed because...", limitations: [...] },
  phase_complete: true
})
```
Then: Retry, Skip (if non-critical), or Abort mission.

## MCP Call Budgets

| Complexity | Calls | Pattern |
|------------|-------|---------|
| Simple | 2 | start + complete |
| Standard | 3-4 | + get_context, 1 log |
| Complex | 5-8 | + multiple logs |

**Avoid**: >8 calls/task, trivial decisions, <10% progress updates.
