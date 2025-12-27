# Workflow Template

<instructions>
1. Get workflow_id from workflow definition (obtained via start_workflow MCP call)
2. Draw ASCII schema first (visual overview)
3. Define phases with explicit numbers in YAML
4. Include agent prompts with MCP instructions
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

**Agent Prompt:**
```
WORKFLOW_ID: <workflow_id>
PHASE: 1
CALLER_TYPE: subagent
AGENT_NAME: <agent-name>

TASK: <specific task>
READ: .claude/workflows/<name>/workflow.md
SCOPE: <paths/components>

DELIVERABLES:
1. <specific action>
2. <specific action>

OUTPUT: .claude/workflows/<name>/<output-file>.md

MCP PROTOCOL:
1. start_task({workflow_id: "<id>", phase: 1, caller_type: "subagent", agent_name: "<name>", name: "<task>", goal: "<goal>"})
2. [During work] log_decision/log_milestone as needed
3. complete_task({task_id: "<id>", status: "success", outcome: {summary: "..."}, phase_complete: true})
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

**Agent Prompt:**
```
WORKFLOW_ID: <workflow_id>
PHASE: 2
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

## MCP Context Query

Sub-agents can query previous phase context:

```
get_context({
  workflow_id: "<workflow_id>",
  include: ["decisions", "milestones"],
  filter: { phase: 1 }
})
```

Returns decisions and progress from specified phase.
