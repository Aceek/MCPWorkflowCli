# Agent Template

<instructions>
For workflow-specific agents in /project/.claude/workflows/<name>/agents/
IMPORTANT: Subagents CANNOT call MCP tools - they return structured output instead.
Delete this block after filling.
</instructions>

```yaml
---
name: <agent-name>
description: <When orchestrator should invoke this agent - be specific>
tools: Read, Write, Grep, Glob  # Minimal set needed (NO MCP tools)
model: sonnet  # sonnet|opus|haiku
---
```

```markdown
# Role
<One sentence: what you are and your expertise>

# Workflow Context
**Workflow**: <workflow_name>
**Phase**: <phase_number>
**Task ID**: <task_id> (provided by orchestrator)

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
4. Return structured output (see format below)

# Output Format (REQUIRED)

You MUST return this structured format. The orchestrator will parse it and log to MCP.

---
STATUS: success | partial | failed

SUMMARY:
<What you accomplished in 2-3 sentences>

ACHIEVEMENTS:
- <Achievement 1>
- <Achievement 2>

DECISIONS:
- Category: architecture | library | approach | scope
  Question: <What was the decision about?>
  Chosen: <What was chosen>
  Reasoning: <Why, 1-2 sentences>

ISSUES:
- Type: blocker | bug | dependency | unclear_requirement
  Description: <What's the issue>
  RequiresHuman: true | false

PROGRESS: <0-100>

FILES_MODIFIED:
- <path/to/file1.ts>
- <path/to/file2.ts>

NEXT_STEPS:
- <What should happen next>
---
```

## Agent Design Principles

| Principle | Implementation |
|-----------|----------------|
| Single responsibility | One clear task per agent |
| Minimal tools | Only tools needed for task |
| **NO MCP calls** | Return structured output instead |
| Scope-bound | Never exceed defined scope |
| Failure-explicit | Use ISSUES section for blockers |

## Common Agent Types

| Type | Purpose | Typical Tools | Output Focus |
|------|---------|---------------|--------------|
| Analyzer | Understand code/docs | Read, Grep, Glob | DECISIONS |
| Implementer | Write/modify code | Read, Write, Edit, Bash | FILES_MODIFIED |
| Reviewer | Validate quality | Read, Grep, Bash (tests) | ISSUES |
| Documenter | Update docs | Read, Write | FILES_MODIFIED |
| Tester | Run/write tests | Read, Write, Bash | ISSUES |

## MCP Note

**Subagents CANNOT call MCP tools** (known Claude Code limitation).

Instead:
1. Orchestrator calls `start_task()` and gets `task_id`
2. Orchestrator passes `task_id` to subagent in prompt
3. Subagent does work and returns structured output
4. Orchestrator parses output and calls:
   - `log_decision()` for each DECISION
   - `log_issue()` for each ISSUE
   - `log_milestone()` for PROGRESS
   - `complete_task()` with SUMMARY/ACHIEVEMENTS
