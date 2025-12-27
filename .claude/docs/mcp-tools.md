# MCP Tools

10 tools for workflow orchestration and tracking.

## Overview

| Tool | Purpose | Caller | Frequency |
|------|---------|--------|-----------|
| `start_workflow` | Create workflow with profile | Orchestrator | 1x/workflow |
| `complete_workflow` | Finalize with summary + metrics | Orchestrator | 1x/workflow |
| `get_context` | Query state (decisions, blockers) | Both | 0-N/workflow |
| `start_phase` | Create phase before launching subagents | Orchestrator | 1x/phase |
| `complete_phase` | Mark phase as completed/failed | Orchestrator | 1x/phase |
| `start_task` | Start task within phase + Git snapshot | Subagent | 1x/task |
| `complete_task` | Complete task + Git diff | Subagent | 1x/task |
| `log_decision` | Architectural decision | Subagent | 0-3/task |
| `log_issue` | Problem/blocker | Subagent | 0-3/task |
| `log_milestone` | Progress update | Subagent | 0-5/task |

## Workflow Tools

### start_workflow

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | yes | Short workflow name |
| `objective` | string | yes | Measurable goal |
| `profile` | enum | no | `simple`\|`standard`\|`complex` |
| `total_phases` | number | no | Expected phases count |
| `scope` | string | no | Included/excluded |
| `constraints` | string | no | Technical limits |

**Returns**: `{ workflow_id, profile, total_phases, created_at }`

### complete_workflow

| Field | Type | Required |
|-------|------|----------|
| `workflow_id` | string | yes |
| `status` | enum | yes | `completed`\|`failed`\|`partial` |
| `summary` | string | yes |
| `achievements` | string[] | no |
| `limitations` | string[] | no |

**Returns**: `{ workflow_id, status, metrics: { total_phases, total_tasks, duration, files_changed } }`

### get_context

| Field | Type | Required |
|-------|------|----------|
| `workflow_id` | string | yes |
| `include` | string[] | yes | `decisions`\|`milestones`\|`blockers`\|`phase_summary`\|`tasks` |
| `filter.phase` | number | no |
| `filter.agent` | string | no |

**Returns**: Context data based on `include` array

## Phase Tools

### start_phase

Called by orchestrator BEFORE launching subagents. Creates a phase container.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `workflow_id` | string | yes | Workflow ID |
| `number` | number | yes | Phase number (1, 2, 3...) |
| `name` | string | yes | Phase name (e.g., "Design Specification") |
| `description` | string | no | Optional description |
| `is_parallel` | boolean | no | Can tasks run in parallel? (default: false) |

**Returns**: `{ phase_id, workflow_id, number, name, is_parallel, status, started_at }`

**Idempotent**: If phase already exists, returns existing phase with `already_exists: true`.

### complete_phase

Called by orchestrator AFTER all tasks in the phase are done.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `phase_id` | string | yes | Phase ID from start_phase |
| `status` | enum | yes | `completed`\|`failed` |
| `summary` | string | no | Optional summary of phase outcome |

**Returns**: `{ phase_id, workflow_id, number, name, status, completed_at, duration_ms, tasks: { total, success, failed, in_progress }, warnings }`

## Task Tools

### start_task

Called by subagent at the start of their work. Creates Git snapshot.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `workflow_id` | string | yes | Workflow ID |
| `phase_id` | string | yes | Phase ID (from start_phase) |
| `caller_type` | enum | yes | `orchestrator`\|`subagent` |
| `agent_name` | string | conditional | Required when caller_type is `subagent` |
| `name` | string | yes | Task name |
| `goal` | string | yes | Task goal |
| `parent_task_id` | string | no | For nested tasks |
| `areas` | string[] | no | Code areas touched |

**Returns**: `{ task_id, workflow_id, phase_id, phase_number, phase_name, caller_type, snapshot_id, snapshot_type, started_at }`

**Git Snapshot**: Stores current HEAD hash for diff calculation.

### complete_task (CRITICAL)

| Field | Type | Required |
|-------|------|----------|
| `task_id` | string | yes |
| `status` | enum | yes | `success`\|`partial_success`\|`failed` |
| `outcome.summary` | string | yes |
| `outcome.achievements` | string[] | no |
| `outcome.limitations` | string[] | no |
| `outcome.next_steps` | string[] | no |
| `outcome.manual_review_needed` | bool | no |
| `metadata.packages_added` | string[] | no |
| `metadata.tests_status` | enum | no | `passed`\|`failed`\|`not_run` |

**Git Diff Logic**:
```
1. Retrieve start_hash from task.snapshotData
2. DIFF 1: git diff <start_hash> HEAD --name-status (commits)
3. DIFF 2: git diff HEAD --name-status (working tree)
4. UNION = All files changed during task
```

**Returns**: `{ task_id, duration_seconds, files_changed, verification, phase_status }`

## Logging Tools

### log_decision

| Field | Type | Required |
|-------|------|----------|
| `task_id` | string | yes |
| `category` | enum | yes | `architecture`\|`library_choice`\|`trade_off`\|`workaround`\|`other` |
| `question` | string | yes |
| `options_considered` | string[] | no |
| `chosen` | string | yes |
| `reasoning` | string | yes |
| `trade_offs` | string | no |

### log_issue

| Field | Type | Required |
|-------|------|----------|
| `task_id` | string | yes |
| `type` | enum | yes | `documentation_gap`\|`bug_encountered`\|`dependency_conflict`\|`unclear_requirement`\|`other` |
| `description` | string | yes |
| `resolution` | string | yes |
| `requires_human_review` | bool | no | Appears as blocker in get_context |

### log_milestone

| Field | Type | Required |
|-------|------|----------|
| `task_id` | string | yes |
| `message` | string | yes |
| `progress` | number | no | 0-100 |
| `metadata` | object | no |

## Orchestrator Protocol

```
1. start_workflow({name, objective, ...}) → workflow_id
2. FOR each phase:
   a. start_phase({workflow_id, number, name, is_parallel}) → phase_id
   b. Launch subagents with workflow_id + phase_id
   c. Subagents: start_task → work → log_* → complete_task
   d. Monitor: get_context({include: ["tasks", "blockers"]})
   e. complete_phase({phase_id, status})
3. complete_workflow({workflow_id, status, summary})
```

## Subagent Protocol

```
1. Receive workflow_id + phase_id from orchestrator prompt
2. start_task({workflow_id, phase_id, caller_type: "subagent", agent_name, name, goal})
3. Do work
4. log_milestone(), log_decision(), log_issue() as needed
5. complete_task({task_id, status, outcome})
```

## WebSocket Events

| Event | Trigger |
|-------|---------|
| `workflow:created` | start_workflow |
| `workflow:updated` | complete_workflow, phase changes |
| `phase:created` | start_phase |
| `phase:updated` | complete_phase |
| `task:created` | start_task |
| `task:updated` | complete_task |

## Enums (Prisma)

```typescript
enum WorkflowStatus { PENDING, IN_PROGRESS, COMPLETED, FAILED, BLOCKED }
enum WorkflowProfile { SIMPLE, STANDARD, COMPLEX }
enum PhaseStatus { PENDING, IN_PROGRESS, COMPLETED, FAILED }
enum TaskStatus { IN_PROGRESS, SUCCESS, PARTIAL_SUCCESS, FAILED }
enum CallerType { ORCHESTRATOR, SUBAGENT }
enum DecisionCategory { ARCHITECTURE, LIBRARY_CHOICE, TRADE_OFF, WORKAROUND, OTHER }
enum IssueType { DOC_GAP, BUG, DEPENDENCY_CONFLICT, UNCLEAR_REQUIREMENT, OTHER }
```
