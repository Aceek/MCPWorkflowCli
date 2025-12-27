# Workflow System Usage

MCP-based orchestration for multi-agent workflows.

## MCP Ownership (CRITICAL)

**Subagents CANNOT call MCP tools** (known Claude Code limitation).

| Caller | MCP Access | Tools Used |
|--------|------------|------------|
| Orchestrator | ✅ Full | `start_task`, `complete_task`, `log_*`, `get_context` |
| Subagent | ❌ None | Standard tools only (Read, Write, Grep, etc.) |

## Quick Reference

| Caller | Responsibility |
|--------|----------------|
| Orchestrator | ALL MCP calls + parse subagent output |
| Sub-agent | Do work + return structured output |

## Orchestrator Protocol

### 1. Setup
```
Read .claude/workflows/<name>/definition.md  → workflow_id, objectives
Read .claude/workflows/<name>/workflow.md    → phases, agents
```

### 2. Phase Loop (Hybrid Pattern)
```
FOR each phase:
  1. start_task({caller_type: "orchestrator", name: "Phase N", ...}) → task_id
  2. Launch sub-agent via Task tool (pass task_id in prompt)
  3. Receive structured output from subagent
  4. Parse output and call MCP:
     - FOR each decision → log_decision({task_id, ...})
     - FOR each issue → log_issue({task_id, ...})
     - log_milestone({task_id, progress, message})
  5. complete_task({task_id, status, outcome, phase_complete: true})
  6. get_context({include: ["blockers"]})
  7. IF blockers → STOP, request human help
```

### 3. Completion
```
complete_workflow({
  workflow_id, status: "completed",
  summary: "...", achievements: [...]
})
```

## Sub-Agent Protocol

### Output Format (REQUIRED)

Subagents MUST return structured output for orchestrator to parse:

```yaml
# Subagent returns this structure
output:
  status: "success" | "partial" | "failed"
  summary: "What was accomplished (2-3 sentences)"

  achievements:          # Optional
    - "Achievement 1"
    - "Achievement 2"

  decisions:             # Optional - orchestrator will log_decision()
    - category: "architecture" | "library" | "approach" | "scope"
      question: "What was the decision about?"
      chosen: "What was chosen"
      reasoning: "Why (1-2 sentences)"

  issues:                # Optional - orchestrator will log_issue()
    - type: "blocker" | "bug" | "dependency" | "unclear_requirement"
      description: "What's the issue"
      requires_human: true | false

  progress: 75           # Optional, 0-100

  files_modified:        # Optional
    - "path/to/file.ts"

  next_steps:            # Optional
    - "What should happen next"
```

### Subagent Prompt Template

```markdown
# Task: {task_name}

**Workflow**: {workflow_name}
**Phase**: {phase_number}
**Task ID**: {task_id}

## Your Goal
{task_goal}

## Scope
{scope_paths}

## Instructions
1. {instruction_1}
2. {instruction_2}
3. {instruction_3}

## Output Format (REQUIRED)

Return a structured result that the orchestrator will parse:

STATUS: success | partial | failed
SUMMARY: What you accomplished (2-3 sentences)

ACHIEVEMENTS:
- Achievement 1
- Achievement 2

DECISIONS: (if any architectural choices were made)
- Category: architecture | library | approach | scope
  Question: What was decided?
  Chosen: What option was selected
  Reasoning: Why this choice

ISSUES: (if any blockers encountered)
- Type: blocker | bug | dependency | unclear_requirement
  Description: What's the issue
  RequiresHuman: true | false

PROGRESS: 0-100 (estimated completion)

FILES_MODIFIED:
- path/to/file1.ts
- path/to/file2.ts
```

## MCP Tool Schemas

### start_task

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `workflow_id` | string | yes | Workflow identifier |
| `caller_type` | string | yes | `orchestrator` or `subagent` |
| `agent_name` | string | no | Agent identifier (for tracking) |
| `name` | string | yes | Task name |
| `goal` | string | yes | Task goal |
| `areas` | string[] | no | Code paths affected |

**Returns**: `{ task_id, started_at }`

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
| `include` | string[] | yes | `decisions`, `milestones`, `blockers`, `tasks` |
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
| `requires_human_review` | bool | no | Creates blocker |

### complete_workflow

| Field | Type | Required |
|-------|------|----------|
| `workflow_id` | string | yes |
| `status` | enum | yes | `completed`, `failed`, `partial` |
| `summary` | string | yes |
| `achievements` | string[] | no |
| `limitations` | string[] | no |

## Orchestrator Parsing Example

```python
# Orchestrator receives subagent output, then:

# 1. Parse decisions and log them
for decision in subagent_output.decisions:
    log_decision({
        task_id: task_id,
        category: decision.category,
        question: decision.question,
        chosen: decision.chosen,
        reasoning: decision.reasoning
    })

# 2. Parse issues and log them
for issue in subagent_output.issues:
    log_issue({
        task_id: task_id,
        type: issue.type,
        description: issue.description,
        requires_human_review: issue.requires_human
    })

# 3. Log progress
log_milestone({
    task_id: task_id,
    message: subagent_output.summary,
    progress: subagent_output.progress
})

# 4. Complete task
complete_task({
    task_id: task_id,
    status: subagent_output.status,
    outcome: {
        summary: subagent_output.summary,
        achievements: subagent_output.achievements
    }
})
```

## Error Handling

### Blocker Detection
1. Subagent returns `issues` with `requires_human: true`
2. Orchestrator calls `log_issue({requiresHumanReview: true})`
3. Orchestrator detects via `get_context({include: ["blockers"]})`
4. Orchestrator STOPS and requests human intervention

### Phase Failure
```
complete_task({
  task_id, status: "failed",
  outcome: { summary: "Failed because...", limitations: [...] }
})
```
Then: Retry, Skip (if non-critical), or Abort workflow.

## MCP Call Budgets

| Complexity | Orchestrator Calls | Pattern |
|------------|-------------------|---------|
| Simple | 2-3 | start + complete |
| Standard | 4-6 | + get_context, 1-2 logs |
| Complex | 6-10 | + multiple logs per decision/issue |

**Note**: Subagents make 0 MCP calls - all logging done by orchestrator.
