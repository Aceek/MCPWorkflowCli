# External Agent Integration Guide

Guide for integrating external agents (feature-planner, feature-implementer, senior-reviewer, etc.) with the mission-control MCP system.

## Overview

External agents are not bundled with mission-control but can use its MCP tools for:
- **State tracking**: Log decisions, progress, and issues
- **Context sharing**: Read decisions from previous phases
- **Observability**: All work is captured in the database

## Required Information

When invoking an external agent as a sub-agent, provide:

| Parameter | Source | Example |
|-----------|--------|---------|
| `mission_id` | From mission.md or orchestrator | `"clxxx..."` |
| `phase` | Current phase number | `2` |
| `caller_type` | Always `"subagent"` | `"subagent"` |
| `agent_name` | Agent identifier | `"feature-implementer"` |

## MCP Tools for Sub-Agents

### Required Tools

| Tool | When | Purpose |
|------|------|---------|
| `start_task` | At start | Register task, get task_id |
| `complete_task` | At end | Finalize task, mark phase complete |

### Optional Tools

| Tool | When | Purpose |
|------|------|---------|
| `get_context` | Before work | Read previous phase decisions |
| `log_decision` | During work | Record architectural choices |
| `log_milestone` | During work | Report progress (with %) |
| `log_issue` | When blocked | Report problems |

## Tool Schemas

### start_task

```json
{
  "mission_id": "clxxx...",
  "phase": 2,
  "phase_name": "Implementation",
  "caller_type": "subagent",
  "agent_name": "feature-implementer",
  "name": "Implement authentication refactoring",
  "goal": "Migrate session-based auth to JWT tokens",
  "areas": ["src/auth", "src/middleware"]
}
```

**Response:**
```json
{
  "task_id": "clyyy...",
  "phase_id": "clzzz...",
  "snapshot_id": "snp_...",
  "started_at": "2024-12-27T10:00:00Z"
}
```

### get_context

Query previous phase decisions:

```json
{
  "mission_id": "clxxx...",
  "include": ["decisions", "milestones"],
  "filter": {
    "phase": 1
  }
}
```

**Response:**
```json
{
  "mission_id": "clxxx...",
  "decisions": [
    {
      "category": "architecture",
      "question": "Which JWT library to use?",
      "chosen": "jose",
      "reasoning": "Zero dependencies, TypeScript native"
    }
  ],
  "milestones": [
    {"message": "Analysis complete", "progress": 100}
  ]
}
```

### log_decision

Record architectural decisions:

```json
{
  "task_id": "clyyy...",
  "category": "architecture",
  "question": "Where to store refresh tokens?",
  "options": ["database", "redis", "cookie"],
  "chosen": "database",
  "reasoning": "Simpler setup, acceptable for current scale"
}
```

### log_milestone

Report progress:

```json
{
  "task_id": "clyyy...",
  "message": "JWT token generation implemented",
  "progress": 45
}
```

### log_issue

Report problems:

```json
{
  "task_id": "clyyy...",
  "type": "blocker",
  "description": "Cannot access database credentials",
  "severity": "high",
  "attemptedSolutions": ["Checked .env", "Asked user"],
  "requiresHumanReview": true
}
```

**Important**: Set `requiresHumanReview: true` for issues that block progress.

### complete_task

Finalize the task:

```json
{
  "task_id": "clyyy...",
  "status": "success",
  "outcome": {
    "summary": "JWT authentication implemented with refresh token support",
    "achievements": [
      "Token generation endpoint",
      "Token validation middleware",
      "Refresh token rotation"
    ],
    "limitations": [
      "Rate limiting not yet implemented"
    ],
    "next_steps": [
      "Add rate limiting",
      "Update API documentation"
    ]
  },
  "phase_complete": true
}
```

**Important**: Set `phase_complete: true` only if this is the last task of the phase.

## Integration Pattern

### Minimal Integration (2 calls)

For agents that just need tracking:

```
1. start_task({...}) → get task_id
2. [Do work]
3. complete_task({task_id, status, outcome, phase_complete: true})
```

### Standard Integration (3-5 calls)

For agents that need context and report progress:

```
1. start_task({...}) → get task_id
2. get_context({...}) → read previous decisions
3. [Do work]
   - log_decision() for key choices
   - log_milestone() for progress updates
4. complete_task({...})
```

### Full Integration (5-8 calls)

For complex agents with multiple decisions and potential blockers:

```
1. start_task({...})
2. get_context({...})
3. [Work phase 1]
   - log_milestone({progress: 25})
   - log_decision({...})
4. [Work phase 2]
   - log_milestone({progress: 50})
   - log_issue({...}) if blocked
5. [Work phase 3]
   - log_milestone({progress: 75})
   - log_decision({...})
6. [Finalize]
   - log_milestone({progress: 100})
7. complete_task({...})
```

## Prompt Template for External Agents

Add this block to any agent prompt to enable MCP integration:

```markdown
## MCP Integration

You have access to mission-control MCP tools. Context:
- **Mission ID**: `<mission_id>`
- **Phase**: <phase_number>
- **Caller Type**: subagent
- **Agent Name**: <your_agent_name>

### At Task Start
Call `start_task` to register your work:
```
start_task({
  mission_id: "<mission_id>",
  phase: <phase_number>,
  caller_type: "subagent",
  agent_name: "<your_agent_name>",
  name: "<task_description>",
  goal: "<task_goal>",
  areas: ["<affected_paths>"]
})
```
Store the returned `task_id`.

### During Execution
- **Decisions**: Use `log_decision` for architectural choices
- **Progress**: Use `log_milestone` for progress updates (include % if known)
- **Blockers**: Use `log_issue` with `requiresHumanReview: true` if blocked

### At Task End
Call `complete_task` to finalize:
```
complete_task({
  task_id: "<your_task_id>",
  status: "success" | "partial_success" | "failed",
  outcome: {
    summary: "<what_was_accomplished>",
    achievements: ["<achievement_1>", "<achievement_2>"],
    limitations: ["<limitation_1>"],
    next_steps: ["<next_step_1>"]
  },
  phase_complete: true  // Set true only if this is the last task of the phase
})
```
```

## Agent-Specific Examples

### feature-planner

```
start_task({
  mission_id: "clxxx...",
  phase: 1,
  caller_type: "subagent",
  agent_name: "feature-planner",
  name: "Create implementation plan for auth refactoring",
  goal: "Analyze codebase and produce detailed implementation plan",
  areas: ["src/auth", "src/api"]
})

// During analysis
log_decision({
  task_id: "...",
  category: "scope",
  question: "Which auth flows to include in scope?",
  chosen: "login, logout, refresh, password-reset",
  reasoning: "Registration handled separately"
})

log_milestone({task_id: "...", message: "Scope analysis complete", progress: 50})
log_milestone({task_id: "...", message: "Plan written", progress: 100})

complete_task({
  task_id: "...",
  status: "success",
  outcome: {
    summary: "Implementation plan created with 4 phases covering 15 files",
    achievements: ["Scope defined", "Dependencies mapped", "Plan documented"]
  },
  phase_complete: true
})
```

### feature-implementer

```
start_task({
  mission_id: "clxxx...",
  phase: 2,
  caller_type: "subagent",
  agent_name: "feature-implementer",
  name: "Implement JWT authentication",
  goal: "Replace session auth with JWT tokens"
})

// Read previous phase decisions
get_context({
  mission_id: "clxxx...",
  include: ["decisions"],
  filter: { phase: 1 }
})

// During implementation
log_decision({
  task_id: "...",
  category: "library",
  question: "JWT library choice",
  chosen: "jose",
  reasoning: "Recommended in analysis phase"
})

log_milestone({task_id: "...", message: "Token generation implemented", progress: 33})
log_milestone({task_id: "...", message: "Middleware updated", progress: 66})
log_milestone({task_id: "...", message: "Tests passing", progress: 100})

complete_task({
  task_id: "...",
  status: "success",
  outcome: {
    summary: "JWT auth implemented across 8 files, all tests passing"
  },
  phase_complete: true
})
```

### senior-reviewer

```
start_task({
  mission_id: "clxxx...",
  phase: 3,
  caller_type: "subagent",
  agent_name: "senior-reviewer",
  name: "Review authentication implementation",
  goal: "Validate implementation quality and security"
})

// Read implementation decisions
get_context({
  mission_id: "clxxx...",
  include: ["decisions", "tasks"],
  filter: { phase: 2 }
})

// If issues found
log_issue({
  task_id: "...",
  type: "security",
  description: "Token expiry too long (24h), recommend 1h with refresh",
  severity: "medium",
  requiresHumanReview: false
})

complete_task({
  task_id: "...",
  status: "partial_success",
  outcome: {
    summary: "Review complete with 2 medium-severity findings",
    achievements: ["Security review complete", "Performance validated"],
    limitations: ["Token expiry should be reduced"]
  },
  phase_complete: true
})
```

## Best Practices

### Do
- Always call `start_task` before doing any work
- Store `task_id` for subsequent calls
- Use `get_context` to read previous phase decisions
- Log significant decisions with reasoning
- Report progress with percentages when possible
- Set `phase_complete: true` only for the last task

### Don't
- Don't skip `start_task` - it creates the Git snapshot
- Don't call `complete_task` without a valid `task_id`
- Don't set `phase_complete: true` for parallel tasks (let orchestrator handle it)
- Don't log trivial decisions (focus on architectural choices)
- Don't flood with milestones (3-5 per task is sufficient)
