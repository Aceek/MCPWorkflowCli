# Workflow Template

<instructions>
1. Get workflow_id from workflow definition (obtained via start_workflow MCP call)
2. Draw ASCII schema first (visual overview)
3. Define phases with explicit numbers in YAML
4. Include agent prompts WITHOUT MCP instructions (subagents cannot call MCP)
5. Delete this block after filling
</instructions>

```markdown
# Workflow: <workflow_name>

**Workflow ID**: `<workflow_id>`
**Total Phases**: <count>

## Schema
┌─────────────────┐
│ Phase 1: <name> │
│   <agents>      │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Phase 2: <name> │
│   <agents>      │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Phase 3: <name> │
│   <agents>      │
└─────────────────┘

## MCP Ownership (CRITICAL)

**Subagents CANNOT call MCP tools** - orchestrator handles all MCP calls.

| Caller | MCP Access | Responsibility |
|--------|------------|----------------|
| Orchestrator | ✅ Full | start_task, complete_task, log_*, get_context |
| Subagent | ❌ None | Do work + return structured output |

## Phases

### Phase 1: <name>

```yaml
phase:
  number: 1
  name: "<Human Readable Name>"
  description: "<What this phase accomplishes>"
  agents:
    - type: <agent-name>
      subagent_type: "general-purpose"
      scope: "<what this agent handles>"
  parallel: false
  outputs:
    - <output_file.md>
  completion: "<criteria>"
```

**Orchestrator Actions:**
```
1. start_task({workflow_id, name: "Phase 1: <name>", goal: "<goal>", caller_type: "orchestrator"}) → task_id
2. Launch subagent via Task tool (include task_id in prompt)
3. Receive structured output from subagent
4. Parse output → log_decision(), log_milestone(), log_issue()
5. complete_task({task_id, status, outcome})
```

**Agent Prompt:**
```
# Task: <task_name>

**Workflow**: <workflow_name>
**Phase**: 1
**Task ID**: {task_id}

## Your Goal
<specific task>

## Scope
<paths/components>

## Instructions
1. <instruction 1>
2. <instruction 2>
3. <instruction 3>

## Output Format (REQUIRED)

Return structured output for orchestrator to parse:

---
STATUS: success | partial | failed

SUMMARY:
<What you accomplished in 2-3 sentences>

ACHIEVEMENTS:
- <Achievement 1>
- <Achievement 2>

DECISIONS:
- Category: architecture | library | approach | scope
  Question: <Decision question>
  Chosen: <Choice made>
  Reasoning: <Why>

ISSUES:
- Type: blocker | bug | dependency | unclear_requirement
  Description: <Issue description>
  RequiresHuman: true | false

PROGRESS: <0-100>

FILES_MODIFIED:
- <path/to/file.ts>
---
```

### Phase 2: <name>

```yaml
phase:
  number: 2
  name: "<Human Readable Name>"
  description: "<What this phase accomplishes>"
  requires: 1
  agents:
    - type: <agent-name>
      subagent_type: "general-purpose"
      scope: "<what this agent handles>"
  parallel: false
  checkpoint: human  # Optional: pause for approval
  completion: "<criteria>"
```

**Orchestrator Actions:**
```
1. start_task({workflow_id, name: "Phase 2: <name>", ...}) → task_id
2. Launch subagent via Task tool
3. Parse output → MCP calls
4. complete_task({task_id, ...})
```

**Agent Prompt:**
```
# Task: <task_name>

**Workflow**: <workflow_name>
**Phase**: 2
**Task ID**: {task_id}

...
```

## Phase Transition Rules

| From | To | Condition |
|------|----|-----------|
| Phase 1 | Phase 2 | <when to transition> |
| Phase 2 | Phase 3 | <when to transition> |

## Rollback Strategy
<What to do if phase fails. Optional.>
```

## ASCII Schema Patterns

### Sequential
```
[Phase 1] → [Phase 2] → [Phase 3]
```

### Parallel then Merge
```
         ┌─[Agent A]─┐
Phase 2: ┼─[Agent B]─┼ → Phase 3
         └─[Agent C]─┘
```

### Conditional Branch
```
Phase 1 ─┬─ condition1 → Phase 2a
         └─ condition2 → Phase 2b
```

### Loop with Review
```
[Implement] ←──────┐
     │             │ fail
     ▼             │
[Review] ──────────┘
     │ pass
     ▼
  [Done]
```

## Orchestrator MCP Flow

For each phase, orchestrator follows this pattern:

```python
# 1. Start task
task_result = start_task({
    workflow_id: workflow_id,
    name: f"Phase {N}: {phase_name}",
    goal: phase_goal,
    caller_type: "orchestrator"
})
task_id = task_result.task_id

# 2. Launch subagent with Task tool
subagent_output = Task({
    subagent_type: "general-purpose",
    prompt: agent_prompt.replace("{task_id}", task_id)
})

# 3. Parse subagent output and log to MCP
for decision in subagent_output.decisions:
    log_decision({task_id, ...decision})

for issue in subagent_output.issues:
    log_issue({task_id, ...issue})

log_milestone({
    task_id,
    message: subagent_output.summary,
    progress: subagent_output.progress
})

# 4. Complete task
complete_task({
    task_id,
    status: subagent_output.status,
    outcome: {
        summary: subagent_output.summary,
        achievements: subagent_output.achievements
    }
})

# 5. Check for blockers
blockers = get_context({workflow_id, include: ["blockers"]})
if blockers:
    # STOP and request human help
```
