# Workflow System Usage

MCP-based orchestration for multi-agent workflows.

## MCP Access

**Subagents CAN call MCP tools directly.** Full access to all `mcp__mission-control__*` tools.

| Caller | MCP Access | Role |
|--------|------------|------|
| Orchestrator | ✅ Full | Creates phases, launches subagents, monitors, completes phases |
| Subagent | ✅ Full | Manages own task lifecycle + logs progress |

## Quick Reference

| Caller | Responsibility |
|--------|----------------|
| Orchestrator | start_workflow → start_phase → launch subagents → monitor → complete_phase → complete_workflow |
| Sub-agent | start_task → work → log_* → complete_task |

## Orchestrator Protocol

### 1. Setup
```
Read .claude/workflows/<name>/definition.md  → workflow_id, objectives
Read .claude/workflows/<name>/workflow.md    → phases, agents
```

### 2. Workflow Start
```
start_workflow({name, objective, profile, total_phases}) → workflow_id
```

### 3. Phase Loop
```
FOR each phase:
  1. start_phase({workflow_id, number, name, is_parallel}) → phase_id
  2. Launch sub-agents via Task tool (pass workflow_id + phase_id in prompt)
  3. Subagent manages own MCP calls:
     - start_task({workflow_id, phase_id, ...}) → task_id
     - [does work]
     - log_milestone(), log_decision(), log_issue()
     - complete_task()
  4. Monitor via get_context({include: ["tasks", "blockers"]})
  5. IF blockers → STOP, request human help
  6. complete_phase({phase_id, status})
```

### 4. Completion
```
complete_workflow({
  workflow_id, status: "completed",
  summary: "...", achievements: [...]
})
```

## Sub-Agent Protocol

Subagents have **full MCP access** and manage their own task lifecycle.

### Subagent MCP Flow

```
1. Receive workflow_id + phase_id from orchestrator (in prompt)
2. start_task({workflow_id, phase_id, caller_type: "subagent", agent_name, name, goal}) → task_id
3. Do work (Read, Write, Edit, Bash, etc.)
4. Log progress in real-time:
   - log_milestone({task_id, message, progress})
   - log_decision({task_id, category, question, chosen, reasoning})
   - log_issue({task_id, type, description}) if blockers
5. complete_task({task_id, status, outcome})
```

### Subagent Prompt Template

```markdown
# Task: {task_name}

**Workflow**: {workflow_name}
**Workflow ID**: `{workflow_id}`
**Phase ID**: `{phase_id}`
**Phase**: {phase_number} - {phase_name}

## Your Goal
{task_goal}

## Scope
{scope_paths}

## Instructions
1. {instruction_1}
2. {instruction_2}
3. {instruction_3}

## MCP Protocol

You have full access to MCP tools. Follow this protocol:

1. Start your task:
   ```
   start_task({
     workflow_id: "{workflow_id}",
     phase_id: "{phase_id}",
     caller_type: "subagent",
     agent_name: "{agent_name}",
     name: "{task_name}",
     goal: "{task_goal}",
     areas: ["{scope_paths}"]
   })
   ```

2. Log progress as you work:
   - `log_milestone({task_id, message, progress})` - for significant progress
   - `log_decision({task_id, category, question, chosen, reasoning})` - for architectural choices

3. If blocked:
   - `log_issue({task_id, type, description, requires_human_review: true})`

4. Complete your task:
   ```
   complete_task({
     task_id,
     status: "success" | "partial_success" | "failed",
     outcome: {
       summary: "What was accomplished",
       achievements: ["..."],
       limitations: ["..."],
       next_steps: ["..."]
     }
   })
   ```
```

## MCP Tool Schemas

### start_phase (Orchestrator only)

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `workflow_id` | string | yes | Workflow identifier |
| `number` | number | yes | Phase number (1, 2, 3...) |
| `name` | string | yes | Phase name |
| `is_parallel` | boolean | no | Can tasks run in parallel? |

**Returns**: `{ phase_id, number, name, status, started_at }`

### complete_phase (Orchestrator only)

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `phase_id` | string | yes | Phase identifier |
| `status` | enum | yes | `completed` or `failed` |
| `summary` | string | no | Phase outcome summary |

**Returns**: `{ phase_id, status, duration_ms, tasks: {...} }`

### start_task

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `workflow_id` | string | yes | Workflow identifier |
| `phase_id` | string | yes | Phase identifier (from start_phase) |
| `caller_type` | string | yes | `orchestrator` or `subagent` |
| `agent_name` | string | conditional | Required when caller_type is `subagent` |
| `name` | string | yes | Task name |
| `goal` | string | yes | Task goal |
| `areas` | string[] | no | Code paths affected |

**Returns**: `{ task_id, phase_id, phase_number, phase_name, started_at }`

### complete_task

| Field | Type | Required |
|-------|------|----------|
| `task_id` | string | yes |
| `status` | enum | yes | `success`, `partial_success`, `failed` |
| `outcome.summary` | string | yes |
| `outcome.achievements` | string[] | no |
| `outcome.limitations` | string[] | no |
| `outcome.next_steps` | string[] | no |

**Returns**: `{ task_id, duration_seconds, files_changed }`

### get_context

| Field | Type | Required |
|-------|------|----------|
| `workflow_id` | string | yes |
| `include` | string[] | yes | `decisions`, `milestones`, `blockers`, `tasks`, `phase_summary` |
| `filter.phase` | number | no |
| `filter.agent` | string | no |

### log_decision

| Field | Type | Required |
|-------|------|----------|
| `task_id` | string | yes |
| `category` | enum | yes | `architecture`, `library_choice`, `trade_off`, `workaround`, `other` |
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
| `type` | enum | yes | `documentation_gap`, `bug_encountered`, `dependency_conflict`, `unclear_requirement`, `other` |
| `description` | string | yes |
| `requires_human_review` | bool | no | Creates blocker |

### complete_workflow

| Field | Type | Required |
|-------|------|----------|
| `workflow_id` | string | yes |
| `status` | enum | yes | `completed`, `failed`, `partial` |
| `summary` | string | yes |
| `achievements` | string[] | no |
| `limitations` | string[] | no |

## Error Handling

### Blocker Detection
1. Subagent calls `log_issue({requires_human_review: true})`
2. Orchestrator detects via `get_context({include: ["blockers"]})`
3. Orchestrator STOPS and requests human intervention

### Phase Failure
```
complete_task({
  task_id, status: "failed",
  outcome: { summary: "Failed because...", limitations: [...] }
})
```
Then: Retry, Skip (if non-critical), or Abort workflow.

## MCP Call Budgets

| Role | Calls per Phase | Pattern |
|------|-----------------|---------|
| Orchestrator | 2-3 | start_phase + monitor + complete_phase |
| Subagent (simple) | 2-3 | start_task + complete_task |
| Subagent (standard) | 4-6 | + 1-2 milestones, 1 decision |
| Subagent (complex) | 6-10 | + multiple logs |

**Note**: Both orchestrator and subagents have full MCP access.
