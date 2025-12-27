# Agent Template

<instructions>
For workflow-specific agents in /project/.claude/workflows/<name>/agents/
Delete this block after filling.
</instructions>

```yaml
---
name: <agent-name>
description: <When orchestrator should invoke this agent - be specific>
tools: Read, Write, Grep, Glob  # Minimal set needed
model: sonnet  # sonnet|opus|haiku
---
```

```markdown
# Role
<One sentence: what you are and your expertise>

# Workflow Context
Read: `.claude/workflows/<name>/workflow.md`
Workflow ID: `<workflow_id>`
Phase: <phase_number>

# Your Task
<Specific task for this agent within the workflow>

## Inputs
- <What to read/analyze>

## Outputs
- <What to produce/update>

## Constraints
- <Scope limits>
- <Quality requirements>

# MCP Protocol

## At Start
```
start_task({
  workflow_id: "<workflow_id>",
  phase: <phase_number>,
  caller_type: "subagent",
  agent_name: "<agent-name>",
  name: "<task_name>",
  goal: "<task_goal>",
  areas: ["<affected_paths>"]
})
```
Store the returned `task_id`.

## During Execution
- `log_decision`: For architectural choices
- `log_milestone`: For progress updates (include % if known)
- `log_issue`: For blockers (set requiresHumanReview: true if blocked)

## Read Previous Context (if needed)
```
get_context({
  workflow_id: "<workflow_id>",
  include: ["decisions"],
  filter: { phase: <previous_phase> }
})
```

## At End
```
complete_task({
  task_id: "<task_id>",
  status: "success" | "partial_success" | "failed",
  outcome: {
    summary: "<what_was_accomplished>",
    achievements: ["<achievement_1>"],
    limitations: ["<limitation_1>"]
  },
  phase_complete: true  // Set true only if last task of phase
})
```

# Execution Steps
1. Call start_task → get task_id
2. [Optional] Query previous phase context via get_context
3. <Step 3>
4. <Step 4>
5. Log decisions and progress as appropriate
6. Call complete_task with outcome summary
7. Return summary to orchestrator

# Output Format
<Specify exact format for return summary>
```

## Agent Design Principles

| Principle | Implementation |
|-----------|----------------|
| Single responsibility | One clear task per agent |
| Minimal tools | Only tools needed for task |
| MCP-aware | Use MCP tools for state tracking |
| Scope-bound | Never exceed defined scope |
| Failure-explicit | Use log_issue for blockers |

## Common Agent Types

| Type | Purpose | Typical Tools | MCP Focus |
|------|---------|---------------|-----------|
| Analyzer | Understand code/docs | Read, Grep, Glob | log_decision |
| Implementer | Write/modify code | Read, Write, Edit, Bash | log_milestone |
| Reviewer | Validate quality | Read, Grep, Bash (tests) | log_issue |
| Documenter | Update docs | Read, Write | log_milestone |
| Tester | Run/write tests | Read, Write, Bash | log_issue |
