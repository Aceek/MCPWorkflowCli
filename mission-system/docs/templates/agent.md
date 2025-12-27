# Agent Template

<instructions>
For mission-specific agents in /project/.claude/missions/<name>/agents/
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

# Mission Context
Read: `.claude/missions/<name>/mission.md`
Memory: `.claude/missions/<name>/memory.md`

# Your Task
<Specific task for this agent within the mission>

## Inputs
- <What to read/analyze>

## Outputs
- <What to produce/update>

## Constraints
- <Scope limits>
- <Quality requirements>

# Execution Steps
1. Read memory.md → understand current state
2. <Step 2>
3. <Step 3>
4. Update memory.md with:
   - Decisions made
   - Progress on your scope
   - Any blockers encountered
5. Return summary to orchestrator

# Output Format
<Specify exact format for return summary>
```

## Agent Design Principles

| Principle | Implementation |
|-----------|----------------|
| Single responsibility | One clear task per agent |
| Minimal tools | Only tools needed for task |
| Memory-aware | Always read/write memory.md |
| Scope-bound | Never exceed defined scope |
| Failure-explicit | Report blockers, don't hide |

## Common Agent Types

| Type | Purpose | Typical Tools |
|------|---------|---------------|
| Analyzer | Understand code/docs | Read, Grep, Glob |
| Implementer | Write/modify code | Read, Write, Edit, Bash |
| Reviewer | Validate quality | Read, Grep, Bash (tests) |
| Documenter | Update docs | Read, Write |
| Tester | Run/write tests | Read, Write, Bash |
