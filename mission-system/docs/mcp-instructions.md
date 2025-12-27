# MCP Instruction Templates

Reusable instruction blocks for integrating agents with mission-control MCP tools.

## Quick Reference

| Caller Type | Who | Required Tools |
|-------------|-----|----------------|
| `orchestrator` | Main agent coordinating phases | start_task, complete_task, complete_mission |
| `subagent` | Agent executing specific tasks | start_task, complete_task |

## Template: Sub-Agent Instructions (Minimal)

Copy this block into any agent prompt that needs basic tracking:

```markdown
## MCP Protocol

**Context:**
- Mission ID: `{mission_id}`
- Phase: {phase_number}

**At Start:**
```
start_task({
  mission_id: "{mission_id}",
  phase: {phase_number},
  caller_type: "subagent",
  agent_name: "{agent_name}",
  name: "{task_name}",
  goal: "{task_goal}"
})
```

**At End:**
```
complete_task({
  task_id: "{task_id}",
  status: "success",
  outcome: { summary: "..." },
  phase_complete: true
})
```
```

## Template: Sub-Agent Instructions (Full)

Copy this block for agents that need full MCP integration:

```markdown
## MCP Integration

You have access to mission-control MCP tools for state tracking.

### Context
- **Mission ID**: `{mission_id}`
- **Phase**: {phase_number}
- **Agent**: {agent_name}

### Required: Task Start
Register your task before any work:
```
start_task({
  mission_id: "{mission_id}",
  phase: {phase_number},
  caller_type: "subagent",
  agent_name: "{agent_name}",
  name: "{task_name}",
  goal: "{task_goal}",
  areas: ["{path1}", "{path2}"]
})
```
Store the `task_id` from the response.

### Optional: Read Previous Context
Query decisions from earlier phases:
```
get_context({
  mission_id: "{mission_id}",
  include: ["decisions", "milestones"],
  filter: { phase: {previous_phase} }
})
```

### Optional: Log During Work
For architectural decisions:
```
log_decision({
  task_id: "{task_id}",
  category: "architecture" | "library" | "approach" | "scope",
  question: "What decision was made?",
  chosen: "The choice made",
  reasoning: "Why this choice"
})
```

For progress updates:
```
log_milestone({
  task_id: "{task_id}",
  message: "What was accomplished",
  progress: 50  // Percentage 0-100
})
```

For blockers:
```
log_issue({
  task_id: "{task_id}",
  type: "blocker",
  description: "What's blocking progress",
  severity: "high",
  requiresHumanReview: true
})
```

### Required: Task End
Finalize your work:
```
complete_task({
  task_id: "{task_id}",
  status: "success" | "partial_success" | "failed",
  outcome: {
    summary: "What was accomplished",
    achievements: ["Achievement 1", "Achievement 2"],
    limitations: ["Any limitations"],
    next_steps: ["Suggested follow-ups"]
  },
  phase_complete: true  // true if last task of phase
})
```
```

## Template: Orchestrator Instructions

Copy this block for orchestrator agents:

```markdown
## MCP Orchestration Protocol

You are the ORCHESTRATOR for mission `{mission_id}`.

### Setup
1. Read `.claude/missions/{name}/mission.md` for objectives
2. Read `.claude/missions/{name}/workflow.md` for phases

### For Each Phase

**1. Start Phase Task:**
```
start_task({
  mission_id: "{mission_id}",
  phase: {N},
  phase_name: "{Phase Name}",
  caller_type: "orchestrator",
  name: "Execute Phase {N}",
  goal: "{phase_objective}"
})
```

**2. Launch Sub-Agent:**
Use Task tool with prompt from workflow.md

**3. After Sub-Agent Returns:**
```
complete_task({
  task_id: "{orchestrator_task_id}",
  status: "success",
  outcome: { summary: "Phase {N} completed" },
  phase_complete: true
})
```

**4. Check for Blockers:**
```
get_context({
  mission_id: "{mission_id}",
  include: ["blockers"],
  filter: { phase: {N} }
})
```
If blockers exist → STOP and report to user.

### Mission Completion
After all phases:
```
complete_mission({
  mission_id: "{mission_id}",
  status: "completed",
  summary: "{overall_summary}",
  achievements: [...]
})
```
```

## Template: Compact Sub-Agent Block

Minimal version for space-constrained prompts:

```markdown
## MCP
Mission: `{mission_id}` | Phase: {N} | Agent: {name}

START: `start_task({mission_id: "{id}", phase: {N}, caller_type: "subagent", agent_name: "{name}", name: "...", goal: "..."})`
LOG: `log_decision/log_milestone/log_issue` as needed
END: `complete_task({task_id: "...", status: "success", outcome: {summary: "..."}, phase_complete: true})`
```

## Variable Reference

When using templates, replace these placeholders:

| Placeholder | Description | Example |
|-------------|-------------|---------|
| `{mission_id}` | ID from start_mission | `"clx9abc123..."` |
| `{phase_number}` | Current phase (1-based) | `2` |
| `{agent_name}` | Agent identifier | `"feature-implementer"` |
| `{task_id}` | ID from start_task response | `"cly8def456..."` |
| `{task_name}` | Short task description | `"Implement JWT auth"` |
| `{task_goal}` | Detailed task objective | `"Replace sessions with JWT"` |
| `{name}` | Mission directory name | `"auth-refactor"` |
| `{N}` | Phase number | `1`, `2`, `3` |

## Tool Summary

### Lifecycle Tools

| Tool | Input | Output | When |
|------|-------|--------|------|
| `start_mission` | name, objective, profile | mission_id | Mission creation |
| `start_task` | mission_id, phase, caller_type, name, goal | task_id | Task start |
| `complete_task` | task_id, status, outcome | duration, files | Task end |
| `complete_mission` | mission_id, status, summary | total metrics | Mission end |

### Logging Tools

| Tool | Input | Output | When |
|------|-------|--------|------|
| `log_decision` | task_id, category, question, chosen | decision_id | Architectural choice |
| `log_milestone` | task_id, message, progress | milestone_id | Progress update |
| `log_issue` | task_id, type, description, severity | issue_id | Problem/blocker |

### Query Tools

| Tool | Input | Output | When |
|------|-------|--------|------|
| `get_context` | mission_id, include, filter | context data | Need previous state |

## caller_type Conventions

| Value | Who Uses It | When |
|-------|-------------|------|
| `orchestrator` | Main coordinating agent | Managing phase execution |
| `subagent` | Task-executing agents | Doing actual work |

## Status Values

### Task Status
| Value | When |
|-------|------|
| `success` | Task completed as intended |
| `partial_success` | Completed with limitations |
| `failed` | Could not complete |

### Mission Status
| Value | When |
|-------|------|
| `completed` | All phases successful |
| `failed` | Critical failure |
| `partial` | Some phases incomplete |

## MCP Call Budgets

Recommended calls per task:

| Agent Complexity | MCP Calls | Breakdown |
|------------------|-----------|-----------|
| Simple | 2 | start_task + complete_task |
| Standard | 3-4 | + get_context, 1 log |
| Complex | 5-8 | + multiple logs |

Avoid:
- More than 8 MCP calls per task
- Logging trivial decisions
- Progress updates < 10% increments
