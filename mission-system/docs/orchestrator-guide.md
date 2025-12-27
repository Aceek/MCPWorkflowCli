# Orchestrator Guide

Pattern documentation for orchestrating multi-agent missions using MCP tools.

## Overview

The orchestrator is the main agent that:
1. Reads mission and workflow definitions
2. Executes phases sequentially (or in parallel where specified)
3. Launches sub-agents for each phase
4. Tracks progress via MCP tools
5. Handles blockers and escalates to humans when needed

## MCP Tools for Orchestrators

| Tool | When to Use | Required |
|------|-------------|----------|
| `start_task` | Before launching each phase | Yes |
| `complete_task` | After phase completes | Yes |
| `get_context` | Check for blockers between phases | Recommended |
| `complete_mission` | After all phases complete | Yes |

## Execution Protocol

### 1. Mission Setup

Before starting execution:

```
1. Read .claude/missions/<name>/mission.md
   → Get mission_id, objectives, constraints

2. Read .claude/missions/<name>/workflow.md
   → Get phase definitions, agent prompts
```

### 2. Phase Execution Loop

For each phase in the workflow:

```
┌─────────────────────────────────────────────────┐
│ Phase N Execution                               │
├─────────────────────────────────────────────────┤
│ 1. start_task (orchestrator)                    │
│ 2. Launch sub-agent via Task tool               │
│ 3. Wait for sub-agent completion                │
│ 4. complete_task (phase_complete: true)         │
│ 5. Check for blockers via get_context           │
│ 6. If blocker → STOP, else → next phase         │
└─────────────────────────────────────────────────┘
```

### 3. Mission Completion

After all phases:

```
complete_mission({
  mission_id: "<id>",
  status: "completed" | "failed" | "partial",
  summary: "Overall mission summary",
  achievements: ["Achievement 1", "Achievement 2"],
  limitations: ["Limitation 1"]  // if any
})
```

## Detailed Tool Usage

### start_task (Orchestrator)

Called before launching each phase's sub-agent:

```json
{
  "mission_id": "clxxx...",
  "phase": 1,
  "phase_name": "Analysis",
  "caller_type": "orchestrator",
  "name": "Execute Phase 1: Analysis",
  "goal": "Complete analysis phase by launching scope-analyzer agent"
}
```

**Response:**
```json
{
  "task_id": "clyyy...",
  "phase_id": "clzzz...",
  "phase_created": true,
  "started_at": "2024-12-27T10:00:00Z"
}
```

Store `task_id` - you need it for `complete_task`.

### Launching Sub-Agents

Use the Task tool to launch sub-agents:

```
Task({
  description: "Phase 1 Analysis",
  subagent_type: "general-purpose",
  prompt: `
    MISSION_ID: clxxx...
    PHASE: 1
    CALLER_TYPE: subagent
    AGENT_NAME: scope-analyzer

    [Full agent prompt from workflow.md]
  `
})
```

### complete_task (Orchestrator)

Called after sub-agent returns:

```json
{
  "task_id": "<orchestrator_task_id>",
  "status": "success",
  "outcome": {
    "summary": "Phase 1 analysis completed. Scope analyzer identified 15 files for refactoring.",
    "achievements": ["Scope defined", "Dependencies mapped"]
  },
  "phase_complete": true
}
```

**Important**: Set `phase_complete: true` to mark the phase as done in the database.

### get_context (Blocker Check)

Check for blockers before proceeding to next phase:

```json
{
  "mission_id": "clxxx...",
  "include": ["blockers"],
  "filter": {
    "phase": 1
  }
}
```

**Response with blockers:**
```json
{
  "mission_id": "clxxx...",
  "blockers": [
    {
      "id": "clbbb...",
      "type": "dependency",
      "description": "Missing API credentials for external service",
      "created_at": "2024-12-27T10:30:00Z"
    }
  ]
}
```

If `blockers` array is non-empty → STOP and report to user.

### complete_mission

Final call after all phases:

```json
{
  "mission_id": "clxxx...",
  "status": "completed",
  "summary": "Authentication refactoring completed successfully across 15 files",
  "achievements": [
    "Migrated from sessions to JWT",
    "Added refresh token support",
    "Updated all API endpoints"
  ]
}
```

**Response:**
```json
{
  "mission_id": "clxxx...",
  "total_duration": 3600,
  "total_tasks": 5,
  "files_changed": 15
}
```

## Error Handling

### Blocker Detection

Blockers are issues logged by sub-agents with `requiresHumanReview: true`:

```
log_issue({
  task_id: "...",
  type: "blocker",
  description: "Cannot proceed: missing database credentials",
  severity: "high",
  requiresHumanReview: true
})
```

### Orchestrator Blocker Response

When blockers are detected:

1. **STOP** the workflow immediately
2. **Report** to the user with:
   - Blocker description
   - Which phase/task encountered it
   - Suggested resolution if known
3. **Wait** for human intervention
4. **Resume** using `get_context` to verify blocker resolved

### Phase Failure

If a sub-agent fails (returns with errors):

```json
{
  "task_id": "<orchestrator_task_id>",
  "status": "failed",
  "outcome": {
    "summary": "Phase 2 failed: implementation agent encountered compilation errors",
    "limitations": ["TypeScript errors in 3 files"],
    "next_steps": ["Review error logs", "Fix type issues"]
  },
  "phase_complete": true
}
```

Then decide:
- **Retry**: Launch sub-agent again with adjusted prompt
- **Skip**: Continue to next phase if non-critical
- **Abort**: Call `complete_mission` with status "failed"

## Parallel Phase Execution

For phases with `parallel: true`:

```
┌────────────────────────────────────────────────────────┐
│ Parallel Phase Execution                               │
├────────────────────────────────────────────────────────┤
│ 1. start_task (orchestrator) for the overall phase     │
│ 2. Launch multiple sub-agents in parallel:             │
│    Task({...agent_A...})                               │
│    Task({...agent_B...})                               │
│    Task({...agent_C...})                               │
│ 3. Wait for ALL sub-agents to complete                 │
│ 4. Aggregate results                                   │
│ 5. complete_task (phase_complete: true)                │
└────────────────────────────────────────────────────────┘
```

## Resume After Interruption

If the orchestrator session is interrupted:

1. Query current state:
   ```json
   {
     "mission_id": "clxxx...",
     "include": ["phase_summary", "tasks", "blockers"]
   }
   ```

2. Response shows progress:
   ```json
   {
     "current_phase": 2,
     "total_phases": 4,
     "phase_summary": [
       {"phase_number": 1, "status": "COMPLETED"},
       {"phase_number": 2, "status": "IN_PROGRESS"}
     ]
   }
   ```

3. Resume from current phase

## Example: Complete Orchestration

```
# Setup
Read mission.md → mission_id = "clxxx..."
Read workflow.md → 3 phases defined

# Phase 1
start_task({mission_id, phase: 1, caller_type: "orchestrator", ...})
→ task_id = "orch_task_1"

Task({subagent_type: "general-purpose", prompt: "..."})
→ Sub-agent completes analysis

complete_task({task_id: "orch_task_1", status: "success", phase_complete: true})

get_context({mission_id, include: ["blockers"], filter: {phase: 1}})
→ No blockers

# Phase 2
start_task({mission_id, phase: 2, caller_type: "orchestrator", ...})
→ task_id = "orch_task_2"

Task({subagent_type: "general-purpose", prompt: "..."})
→ Sub-agent implements changes

complete_task({task_id: "orch_task_2", status: "success", phase_complete: true})

get_context({mission_id, include: ["blockers"], filter: {phase: 2}})
→ No blockers

# Phase 3
start_task({mission_id, phase: 3, caller_type: "orchestrator", ...})
→ task_id = "orch_task_3"

Task({subagent_type: "general-purpose", prompt: "..."})
→ Sub-agent reviews and validates

complete_task({task_id: "orch_task_3", status: "success", phase_complete: true})

# Mission Complete
complete_mission({
  mission_id,
  status: "completed",
  summary: "All 3 phases completed successfully",
  achievements: [...]
})
```

## Quick Reference

| Action | Tool Call |
|--------|-----------|
| Start a phase | `start_task({mission_id, phase, caller_type: "orchestrator", ...})` |
| Launch sub-agent | `Task({subagent_type, prompt})` |
| Complete phase | `complete_task({task_id, status, outcome, phase_complete: true})` |
| Check blockers | `get_context({mission_id, include: ["blockers"]})` |
| Finish mission | `complete_mission({mission_id, status, summary})` |
| Resume mission | `get_context({mission_id, include: ["phase_summary", "tasks"]})` |
