# Agent Template

<instructions>
For workflow-specific agents in /project/.claude/workflows/<name>/agents/
Subagents have FULL MCP access - include MCP protocol in prompts.
Delete this block after filling.
</instructions>

```yaml
---
name: <agent-name>
description: <When orchestrator should invoke this agent - be specific>
tools: Read, Write, Grep, Glob  # Standard tools + MCP tools available
model: sonnet  # sonnet|opus|haiku
---
```

```markdown
# Role
<One sentence: what you are and your expertise>

# Workflow Context
**Workflow**: <workflow_name>
**Workflow ID**: `{workflow_id}`
**Phase**: <phase_number>

# Your Task
<Specific task for this agent within the workflow>

## Inputs
- <What to read/analyze>

## Outputs
- <What to produce/update>

## Constraints
- <Scope limits>
- <Quality requirements>

# Execution Steps
1. <Step 1>
2. <Step 2>
3. <Step 3>
4. Complete task via MCP

# MCP Protocol

You have full access to MCP tools. Follow this protocol:

## 1. Start Task
```
start_task({
  workflow_id: "{workflow_id}",
  name: "<task_name>",
  goal: "<goal>",
  caller_type: "subagent",
  agent_name: "<agent-name>",
  areas: ["<scope>"]
})
```

## 2. Log Progress (as you work)
```
log_milestone({task_id, message: "Completed X", progress: 50})
log_decision({task_id, category: "architecture", question: "...", chosen: "...", reasoning: "..."})
```

## 3. If Blocked
```
log_issue({task_id, type: "blocker", description: "...", requires_human_review: true})
```

## 4. Complete Task
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

## Agent Design Principles

| Principle | Implementation |
|-----------|----------------|
| Single responsibility | One clear task per agent |
| Minimal tools | Only tools needed for task |
| **Full MCP access** | Manage own task lifecycle |
| Scope-bound | Never exceed defined scope |
| Failure-explicit | Use log_issue() for blockers |

## Common Agent Types

| Type | Purpose | Typical Tools | MCP Focus |
|------|---------|---------------|-----------|
| Analyzer | Understand code/docs | Read, Grep, Glob | log_decision |
| Implementer | Write/modify code | Read, Write, Edit, Bash | log_milestone |
| Reviewer | Validate quality | Read, Grep, Bash (tests) | log_issue |
| Documenter | Update docs | Read, Write | log_milestone |
| Tester | Run/write tests | Read, Write, Bash | log_issue |

## MCP Access

**Subagents CAN call MCP tools directly.** Full access to all `mcp__mission-control__*` tools.

Subagent MCP flow:
1. Receive workflow_id from orchestrator (in prompt)
2. `start_task()` → get task_id
3. Do work with standard tools
4. `log_milestone()`, `log_decision()` as you progress
5. `log_issue()` if blocked
6. `complete_task()` when done
