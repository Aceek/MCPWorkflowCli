# Workflow Template

<instructions>
1. Get workflow_id from workflow definition (obtained via start_workflow MCP call)
2. Draw ASCII schema first (visual overview)
3. Define phases with explicit numbers in YAML
4. Include agent prompts WITH MCP protocol (subagents have full MCP access)
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

## MCP Access

**Subagents CAN call MCP tools directly.** Full access to all `mcp__mission-control__*` tools.

| Caller | MCP Access | Role |
|--------|------------|------|
| Orchestrator | ✅ Full | Coordinates phases, monitors progress |
| Subagent | ✅ Full | Manages own task lifecycle + logs progress |

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
1. Launch subagent via Task tool (pass workflow_id in prompt)
2. Monitor via get_context({include: ["tasks", "blockers"]})
3. Handle blockers if requires_human_review
```

**Agent Prompt:**
```
# Task: <task_name>

**Workflow**: <workflow_name>
**Workflow ID**: `{workflow_id}`
**Phase**: 1

## Your Goal
<specific task>

## Scope
<paths/components>

## Instructions
1. <instruction 1>
2. <instruction 2>
3. <instruction 3>

## MCP Protocol

You have full access to MCP tools. Follow this protocol:

1. Start your task:
   start_task({
     workflow_id: "{workflow_id}",
     name: "<task_name>",
     goal: "<goal>",
     caller_type: "subagent",
     agent_name: "<agent>",
     areas: ["<scope>"]
   })

2. Log progress as you work:
   - log_milestone({task_id, message, progress}) - for significant progress
   - log_decision({task_id, category, question, chosen, reasoning}) - for choices

3. If blocked:
   log_issue({task_id, type, description, requires_human_review: true})

4. Complete your task:
   complete_task({
     task_id,
     status: "success" | "partial_success" | "failed",
     outcome: { summary, achievements, limitations, next_steps }
   })
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
1. Launch subagent via Task tool (pass workflow_id)
2. Monitor via get_context()
3. Handle blockers
```

**Agent Prompt:**
```
# Task: <task_name>

**Workflow**: <workflow_name>
**Workflow ID**: `{workflow_id}`
**Phase**: 2

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

## Orchestrator Flow

For each phase, orchestrator follows this pattern:

```python
# 1. Launch subagent with workflow_id
subagent_result = Task({
    subagent_type: "general-purpose",
    prompt: agent_prompt.replace("{workflow_id}", workflow_id)
})
# Subagent manages its own MCP calls:
# - start_task() → task_id
# - log_milestone(), log_decision(), log_issue()
# - complete_task()

# 2. Monitor progress
context = get_context({workflow_id, include: ["tasks", "blockers"]})

# 3. Check for blockers requiring human review
if context.blockers:
    # STOP and request human help
```
